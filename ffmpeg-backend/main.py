from flask import Flask, request, jsonify, send_from_directory, send_file
from flask_cors import CORS
import subprocess
import os
import shlex
import sys
import re
import unicodedata
from werkzeug.utils import secure_filename
import threading
import traceback
import glob

app = Flask(__name__)
CORS(app, supports_credentials=True)  # Allow all origins, all headers, all methods

UPLOAD_FOLDER = os.path.abspath(os.path.dirname(__file__))


capture_proc = None
capture_output_file = None

@app.route('/api/capture/start', methods=['POST'])
def start_capture():
    global capture_proc, capture_output_file
    data = request.json
    cmd = data.get('command')
    output_file = data.get('output_file')  # Front-end should send the output filename
    if not cmd or not output_file:
        return jsonify({'error': 'No command or output_file provided'}), 400

    capture_output_file = output_file

    def run_capture():
        global capture_proc
        capture_proc = subprocess.Popen(cmd, shell=True)

    threading.Thread(target=run_capture, daemon=True).start()
    return jsonify({'status': 'recording_started'})

@app.route('/api/capture/stop', methods=['POST'])
def stop_capture():
    global capture_proc, capture_output_file
    if capture_proc:
        capture_proc.terminate()
        capture_proc.wait()
        filename = capture_output_file
        capture_proc = None
        capture_output_file = None

        # Option 1: Return just a JSON status and filename to download separately
        return jsonify({'status': 'recording_stopped', 'filename': filename})

    return jsonify({'error': 'No active recording'}), 400


@app.route('/api/capture/probe', methods=['POST'])
def probe_capture_device():
    data = request.json
    cmd = data.get('command')
    if not cmd:
        return jsonify({'error': 'No command provided'}), 400

    try:
        # Run FFmpeg probe command and capture output
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=10)
        return jsonify({
            'stdout': result.stdout,
            'stderr': result.stderr,
            'returncode': result.returncode
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
                        
@app.route('/files/<path:filename>')
def serve_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename, as_attachment=False)

def sanitize_filename(filename):
    filename = unicodedata.normalize("NFKD", filename).encode("ascii", "ignore").decode("ascii")
    filename = secure_filename(filename)
    filename = filename.replace(" ", "_").lower()
    if not filename:
        filename = "uploaded_file"
    return filename

@app.route('/upload', methods=['POST', 'OPTIONS'])
def upload_files():
    if request.method == 'OPTIONS':
        return '', 204
    # Accept both single and multiple files
    files = request.files.getlist('file')
    if not files or files == [None]:
        return jsonify({'success': False, 'message': 'No file part(s) found.'}), 400

    saved_files = []
    for file in files:
        if file.filename == '':
            continue  # skip empty
        sanitized_name = sanitize_filename(file.filename)
        save_path = os.path.join(UPLOAD_FOLDER, sanitized_name)
        file.save(save_path)
        saved_files.append(sanitized_name)

    if not saved_files:
        return jsonify({'success': False, 'message': 'No valid files uploaded.'}), 400

    return jsonify({'success': True, 'filenames': saved_files})

def handle_join_operation(data):
    filenames = data.get('filenames')
    output = sanitize_filename(data.get('output', 'joined_output.mp4'))
    if not filenames or len(filenames) < 2:
        return jsonify({'success': False, 'message': 'Need at least two files to join.'}), 400

    file_list_path = os.path.join(UPLOAD_FOLDER, "file_list.txt")
    with open(file_list_path, "w") as f:
        for name in filenames:
            safe_name = sanitize_filename(name)
            f.write(f"file '{safe_name}'\n")

    # Use browser-friendly codecs for output!
    cmd = [
        "ffmpeg", "-y", "-f", "concat", "-safe", "0",
        "-i", "file_list.txt",
        "-c:v", "libx264", "-c:a", "aac", "-movflags", "+faststart",
        output
    ]
    print("Join args:", cmd, file=sys.stderr)
    try:
        proc = subprocess.run(cmd, cwd=UPLOAD_FOLDER, capture_output=True, text=True, timeout=600)
        output_text = proc.stdout + proc.stderr
        if proc.returncode == 0:
            return jsonify({
                'success': True,
                'message': 'Join command executed successfully.',
                'output': output_text,
                'output_file': output
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Join command failed.',
                'output': output_text,
                'output_file': output
            })
    except Exception as e:
        return jsonify({'success': False, 'message': 'Exception occurred (join).', 'error': str(e)}), 500

def handle_gif_palette_operation(data):
    input_file = sanitize_filename(data.get('inputFile'))
    output_file = sanitize_filename(data.get('output', 'output.gif'))
    scale_height = str(data.get('scale_height', 320))
    fps = str(data.get('fps', 10))
    start_time = data.get('start_time', None)  # Optional: "00:00:05"
    duration = data.get('duration', None)      # Optional: "10"
    palette_file = "palette.png"

    input_path = os.path.join(UPLOAD_FOLDER, input_file)
    palette_path = os.path.join(UPLOAD_FOLDER, palette_file)
    output_path = os.path.join(UPLOAD_FOLDER, output_file)

    # Build filter string
    filter_str = f"fps={fps},scale=-1:{scale_height}:flags=lanczos"

    # Palettegen command
    palettegen_cmd = [
        "ffmpeg", "-y"
    ]
    if start_time:
        palettegen_cmd += ["-ss", str(start_time)]
    if duration:
        palettegen_cmd += ["-t", str(duration)]
    palettegen_cmd += ["-i", input_file, "-vf", f"{filter_str},palettegen", palette_file]

    # Paletteuse command
    paletteuse_cmd = [
        "ffmpeg", "-y"
    ]
    if start_time:
        paletteuse_cmd += ["-ss", str(start_time)]
    if duration:
        paletteuse_cmd += ["-t", str(duration)]
    paletteuse_cmd += [
        "-i", input_file,
        "-i", palette_file,
        "-filter_complex", f"[0:v]{filter_str}[x];[x][1:v]paletteuse",
        output_file
    ]

    print("Palettegen command:", " ".join(palettegen_cmd), file=sys.stderr)
    print("Paletteuse command:", " ".join(paletteuse_cmd), file=sys.stderr)

    # Step 1: Palettegen
    try:
        proc1 = subprocess.run(palettegen_cmd, cwd=UPLOAD_FOLDER, capture_output=True, text=True, timeout=600)
        output1 = proc1.stdout + proc1.stderr
        if proc1.returncode != 0:
            return jsonify({'success': False, 'message': 'Palettegen failed.', 'output': output1})

        # Step 2: Paletteuse
        proc2 = subprocess.run(paletteuse_cmd, cwd=UPLOAD_FOLDER, capture_output=True, text=True, timeout=600)
        output2 = proc2.stdout + proc2.stderr
        if proc2.returncode == 0:
            return jsonify({
                'success': True,
                'message': 'GIF created successfully with palette.',
                'output': output1 + "\n" + output2,
                'output_file': output_file
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Paletteuse failed.',
                'output': output1 + "\n" + output2,
                'output_file': output_file
            })

    except Exception as e:
        return jsonify({'success': False, 'message': 'Exception occurred (gif_palette).', 'error': str(e)}), 500

def handle_segment_hls_operation(data):
    input_file = sanitize_filename(data.get("inputFile"))
    segment_duration = data.get("segmentDuration", 10)
    base_name = os.path.splitext(input_file)[0]
    output_file = f"{base_name}.m3u8"

    input_path = os.path.join(UPLOAD_FOLDER, input_file)
    if not os.path.exists(input_path):
        return jsonify({
            "success": False,
            "message": f"Input file {input_file} not found."
        }), 404

    cmd = [
        "ffmpeg",
        "-i", input_file,
        "-c", "copy",
        "-hls_time", str(segment_duration),
        "-hls_list_size", "0",
        "-f", "hls",
        output_file,
    ]

    try:
        proc = subprocess.run(
            cmd,
            cwd=UPLOAD_FOLDER,
            capture_output=True,
            text=True,
            timeout=600,
        )
        output = proc.stdout + proc.stderr
        if proc.returncode == 0:
            return jsonify({
                "success": True,
                "message": "Segmentation succeeded.",
                "output": output,
                "output_file": output_file,
            })
        else:
            return jsonify({
                "success": False,
                "message": "Segmentation failed.",
                "output": output,
                "output_file": output_file,
            }), 500
    except Exception as e:
        return jsonify({
            "success": False,
            "message": "Exception during segmentation.",
            "error": str(e),
        }), 500

def handle_analysis_operation(data):
    # sanitize and locate the uploaded file
    input_file = sanitize_filename(data.get("inputFile"))
    input_path = os.path.join(UPLOAD_FOLDER, input_file)

    if not os.path.exists(input_path):
        return jsonify({
            "success": False,
            "message": f"Input file {input_file} not found on server."
        }), 404

    # build the ffprobe command
    cmd = [
        "ffprobe",
        "-v", "error",
        "-show_format",
        "-show_streams",
        input_file
    ]

    # run it
    try:
        proc = subprocess.run(
            cmd,
            cwd=UPLOAD_FOLDER,
            capture_output=True,
            text=True,
            timeout=60
        )
        output = proc.stdout + proc.stderr

        if proc.returncode == 0:
            return jsonify({
                "success": True,
                "output": output
            })
        else:
            return jsonify({
                "success": False,
                "message": "ffprobe reported errors",
                "output": output
            }), 500

    except Exception as e:
        return jsonify({
            "success": False,
            "message": "Exception during analysis",
            "error": str(e)
        }), 500

def handle_stabilize_operation(data):
    import traceback
    import sys
    import os
    import glob
    import re
    import subprocess
    import shutil
    from datetime import datetime
    from flask import jsonify

    print("---- [STABILIZE] Handler called ----", file=sys.stderr)
    sys.stderr.flush()

    try:
        input_file = sanitize_filename(data.get('inputFile'))
        input_path = os.path.join(UPLOAD_FOLDER, input_file)
        print(f"[STABILIZE] input_file: {input_file}", file=sys.stderr)
        print(f"[STABILIZE] input_path: {input_path}", file=sys.stderr)
        sys.stderr.flush()

        if not os.path.exists(input_path):
            print("[STABILIZE] ERROR: input file does not exist", file=sys.stderr)
            return jsonify({'success': False, 'message': f'Input file {input_file} not found.'}), 404

        # --- Make unique output folder ---
        now = datetime.now()
        folder_name = f"stabilize{now.strftime('%H%M%S')}"
        out_dir = os.path.join(UPLOAD_FOLDER, folder_name)
        os.makedirs(out_dir, exist_ok=True)

        # Copy input file into the output folder
        input_copy_path = os.path.join(out_dir, input_file)
        shutil.copy2(input_path, input_copy_path)

        command_block = data.get('command')
        print(f"[STABILIZE] command_block: {command_block}", file=sys.stderr)
        sys.stderr.flush()

        if not command_block or "ffmpeg" not in command_block:
            print("[STABILIZE] ERROR: No valid command block", file=sys.stderr)
            return jsonify({'success': False, 'message': 'No valid ffmpeg command block provided.'}), 400

        base_name = os.path.splitext(input_file)[0]
        trf_file = f"{base_name}.trf"
        trf_path = os.path.join(out_dir, trf_file)

        # Extract exactly two ffmpeg commands (analyze, stabilize)
        lines = [line.strip() for line in command_block.splitlines() if line.strip().startswith("ffmpeg")]
        if len(lines) != 2:
            print("[STABILIZE] ERROR: Not exactly 2 ffmpeg commands", file=sys.stderr)
            return jsonify({'success': False, 'message': 'Expected two ffmpeg commands (analyze + stabilize).'}), 400

        analyze_cmd, stabilize_cmd = lines

        # PATCH analyze: ensure result points to folder
        if "vidstabdetect" in analyze_cmd:
            analyze_cmd = re.sub(
                r'(vidstabdetect=[^":]*)',
                lambda m: (
                    re.sub(r':?result=[^:"]*', '', m.group(1)).rstrip(':') + f':result={trf_file}'
                ),
                analyze_cmd
            )
            # Update the input file path to point to our new location
            analyze_cmd = analyze_cmd.replace(input_file, input_copy_path)

        print(f"[STABILIZE] PATCHED analyze_cmd: {analyze_cmd}", file=sys.stderr)

        # ---- Run Step 1: Analyze ----
        proc1 = subprocess.run(analyze_cmd, shell=True, cwd=out_dir, capture_output=True, text=True, timeout=300)
        output1 = proc1.stdout + proc1.stderr
        if proc1.returncode != 0:
            print("[STABILIZE] ERROR: Analyze step failed", file=sys.stderr)
            return jsonify({
                'success': False,
                'step': 'analyze',
                'message': 'Analyze (vidstabdetect) failed.',
                'output': output1
            }), 500

        # STEP 2: Find the .trf file (should be right in out_dir)
        clean_trf_path = os.path.join(out_dir, trf_file)
        if not os.path.exists(clean_trf_path):
            print(f"[STABILIZE] ERROR: No clean .trf file found for {base_name}", file=sys.stderr)
            return jsonify({
                'success': False,
                'step': 'analyze',
                'message': f'vidstabdetect did not produce a .trf file for {base_name}',
                'output': output1
            }), 500

        # PATCH: Always set input=<abs trf> as the ONLY input param in vidstabtransform
        abs_trf_path = os.path.abspath(clean_trf_path)
        stabilize_cmd = re.sub(
            r'input=[^:\"\s]+',
            f'input={abs_trf_path}',
            stabilize_cmd
        )
        # If not present, add as last param to the vidstabtransform filter
        if "input=" not in stabilize_cmd:
            stabilize_cmd = re.sub(
                r'(vidstabtransform[^\"]*)',
                r'\1:input={}'.format(abs_trf_path),
                stabilize_cmd
            )

        # Patch input/output file in stabilize_cmd
        stabilize_cmd = stabilize_cmd.replace(input_file, input_copy_path)
        # Patch output file to also be in out_dir
        # Try to extract the output filename
        out_match = re.findall(r'\"([^\"]+\.(mp4|mov|mkv|webm|avi|m4v|mpg|mpeg|gif|ts))\"', stabilize_cmd)
        if out_match:
            orig_output_name = out_match[-1][0]
            # Ensure output in out_dir
            output_file_path = os.path.join(out_dir, os.path.basename(orig_output_name))
            # Replace in command
            stabilize_cmd = stabilize_cmd.replace(orig_output_name, output_file_path)
        else:
            output_file_path = None

        print(f"[STABILIZE] PATCHED stabilize_cmd: {stabilize_cmd}", file=sys.stderr)

        # ---- STEP 3: Run stabilize ----
        proc2 = subprocess.run(stabilize_cmd, shell=True, cwd=out_dir, capture_output=True, text=True, timeout=600)
        output2 = proc2.stdout + proc2.stderr

        if proc2.returncode == 0:
            print("[STABILIZE] Success!", file=sys.stderr)
            return jsonify({
                'success': True,
                'message': 'Stabilization succeeded.',
                'output_analyze': output1,
                'output_stabilize': output2,
                'output_folder': folder_name,
                'trf_file': os.path.relpath(clean_trf_path, UPLOAD_FOLDER),
                'output_file': os.path.relpath(output_file_path, UPLOAD_FOLDER) if output_file_path else None,
            })
        else:
            print("[STABILIZE] ERROR: Stabilize step failed", file=sys.stderr)
            return jsonify({
                'success': False,
                'step': 'stabilize',
                'message': 'Stabilization (vidstabtransform) failed.',
                'output_analyze': output1,
                'output_stabilize': output2,
                'output_folder': folder_name,
                'trf_file': os.path.relpath(clean_trf_path, UPLOAD_FOLDER),
                'output_file': os.path.relpath(output_file_path, UPLOAD_FOLDER) if output_file_path else None,
            }), 500

    except Exception as e:
        print(f"[STABILIZE] EXCEPTION: {e}", file=sys.stderr)
        print(traceback.format_exc(), file=sys.stderr)
        sys.stderr.flush()
        return jsonify({'success': False, 'message': 'Exception during stabilization.', 'error': str(e)}), 500

@app.route('/preview', methods=['POST', 'OPTIONS'])
def preview():
    if request.method == 'OPTIONS':
        return '', 204

    data = request.get_json()
    command = data.get("command")
    input_file = data.get("inputFile")
    preview = data.get("preview", False)
    preview_type = data.get("previewType", "video")  # Optional: "video" (default) or "image"

    if not command or not isinstance(command, str) or not command.strip().startswith("ffmpeg"):
        return jsonify({'success': False, 'message': 'Only ffmpeg commands are allowed.'}), 400
    if not input_file:
        return jsonify({'success': False, 'message': 'No input file provided.'}), 400

    # Sanitize input file
    input_file = sanitize_filename(input_file)
    input_path = os.path.join(UPLOAD_FOLDER, input_file)
    if not os.path.exists(input_path):
        return jsonify({'success': False, 'message': f'Input file {input_file} not found.'}), 404

    # Determine output preview filename/type
    base_name = os.path.splitext(input_file)[0]
    if preview_type == "image":
        preview_file = f"{base_name}_preview.jpg"
        preview_cmd = f'ffmpeg -y -i "{input_file}" -vf "select=eq(n\\,10)" -vframes 1 "{preview_file}"'
    else:  # default: short video
        preview_file = f"{base_name}_preview.mp4"
        preview_cmd = f'ffmpeg -y -i "{input_file}" -ss 00:00:03 -t 2 -c:v libx264 -c:a aac "{preview_file}"'

    # Allow a filter pipeline to be injected if present in 'command'
    # If the command string contains '-vf' or '-filter_complex', add them to preview_cmd
    # For a true "live" preview, parse and insert filter section from main command (optional, see below)

    # Try to extract filters from original command and inject into preview command
    filter_vf = None
    filter_complex = None
    args = shlex.split(command)
    if "-vf" in args:
        idx = args.index("-vf")
        filter_vf = args[idx + 1]
    if "-filter_complex" in args:
        idx = args.index("-filter_complex")
        filter_complex = args[idx + 1]
    if filter_complex:
        preview_cmd = f'ffmpeg -y -i "{input_file}" -ss 00:00:03 -t 2 -filter_complex \'{filter_complex}\' -c:v libx264 -c:a aac "{preview_file}"'
    elif filter_vf:
        preview_cmd = f'ffmpeg -y -i "{input_file}" -ss 00:00:03 -t 2 -vf \'{filter_vf}\' -c:v libx264 -c:a aac "{preview_file}"'

    print("Preview command:", preview_cmd)

    # Run the preview command
    try:
        proc = subprocess.run(
            preview_cmd,
            cwd=UPLOAD_FOLDER,
            shell=True,
            capture_output=True,
            text=True,
            timeout=60
        )
        output = proc.stdout + proc.stderr

        if proc.returncode == 0 and os.path.exists(os.path.join(UPLOAD_FOLDER, preview_file)):
            return jsonify({
                "success": True,
                "message": "Preview generated.",
                "preview_url": preview_file,
                "output": output
            })
        else:
            return jsonify({
                "success": False,
                "message": "Preview command failed.",
                "output": output,
                "preview_url": None
            }), 500

    except Exception as e:
        return jsonify({
            "success": False,
            "message": "Exception during preview.",
            "error": str(e),
        }), 500
    
operation_handlers = {
    'join': handle_join_operation,
    'gif_palette': handle_gif_palette_operation,
    'analyze': handle_analysis_operation,
    'segment_hls' : handle_segment_hls_operation,
    'stabilize': handle_stabilize_operation,   

    # Add more as needed...
}
    
@app.route('/run', methods=['POST', 'OPTIONS'])
def run():
    print(f"Received {request.method} on /run", file=sys.stderr)
    if request.method == 'OPTIONS':
        return '', 204

    data = request.get_json()
    operation = data.get('operation')

    if operation in operation_handlers:
        return operation_handlers[operation](data)
    
    # --- Dispatch by operation ---
    # if operation == 'join':
    #     return handle_join_operation(data)
    # elif operation == 'gif_palette':
    #     return handle_gif_palette_operation(data)
    # elif operation == 'analyze':
    #     return handle_analysis_operation(data)
    # Future: elif operation == 'trim': return handle_trim_operation(data)

    # --- Standard FFmpeg Command ---
    command = data.get('command')
    input_file = data.get('inputFile', None)
    allowed_cmds = ('ffmpeg', 'ffprobe')
    if not command or not isinstance(command, str) or not command.strip().startswith(allowed_cmds):
        return jsonify({'success': False, 'message': 'Only ffmpeg commands are allowed.'}), 400

    # Always overwrite output files without asking
    if command.startswith("ffmpeg "):
        command = command.replace("ffmpeg ", "ffmpeg -y ", 1)

    if input_file:
        file_path = os.path.join(UPLOAD_FOLDER, input_file)
        if not os.path.exists(file_path):
            return jsonify({'success': False, 'message': f'Input file {input_file} not found on server.'}), 404

    try:
        print("About to call subprocess", file=sys.stderr)
        args = shlex.split(command.strip())
        print("After -y Args for FFmpeg:", args, file=sys.stderr)
        sys.stderr.flush()
        proc = subprocess.run(args, capture_output=True, text=True, timeout=600, cwd=UPLOAD_FOLDER)
        print("Subprocess complete", file=sys.stderr)
        sys.stderr.flush()

        output = proc.stdout + proc.stderr
        print(f"Output is {len(output)} bytes", file=sys.stderr)

        # Naive guess: last arg is output file
        output_file = args[-1] if len(args) > 2 else None
        print(f"Final test to determine quality {request.method} on /run", file=sys.stderr)

        if proc.returncode == 0:
            return jsonify({
                'success': True,
                'message': 'Command executed successfully.',
                'output': output,
                'output_file': output_file
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Command failed.',
                'output': output,
                'output_file': output_file
            })

    except Exception as e:
        return jsonify({'success': False, 'message': 'Exception occurred.', 'error': str(e)}), 500


@app.route('/api/frame', methods=['GET'])
def get_video_frame():
    import tempfile
    import shutil

    filename = request.args.get('file')
    if not filename:
        return jsonify({'success': False, 'message': 'No file specified.'}), 400

    sanitized = sanitize_filename(filename)
    input_path = os.path.join(UPLOAD_FOLDER, sanitized)

    if not os.path.exists(input_path):
        return jsonify({'success': False, 'message': f'File {sanitized} not found.'}), 404

    # Use a temporary file for the extracted frame
    with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as tmpfile:
        frame_path = tmpfile.name

    # Use ffmpeg to extract frame 10 (can adjust as needed)
    ffmpeg_cmd = [
        'ffmpeg', '-y', '-i', input_path,
        '-vf', 'select=eq(n\\,10)',
        '-vframes', '1',
        frame_path
    ]
    print("FFmpeg frame extract:", " ".join(ffmpeg_cmd))

    try:
        proc = subprocess.run(ffmpeg_cmd, capture_output=True, text=True, timeout=30)
        if proc.returncode != 0 or not os.path.exists(frame_path):
            print(proc.stderr)
            return jsonify({'success': False, 'message': 'Failed to extract frame.', 'output': proc.stderr}), 500

        # Send the image file directly
        return send_file(frame_path, mimetype='image/jpeg')

    finally:
        # Clean up the temp file on next server restart (or leave for debugging)
        pass


@app.route("/upload-timeline", methods=["POST"])
def upload_timeline():
    f = request.files["timeline"]
    timeline_path = os.path.join(UPLOAD_FOLDER, f.filename)
    f.save(timeline_path)
    return jsonify({"timeline_path": timeline_path})

@app.route("/render", methods=["POST"])
def render():
    data = request.json
    timeline_path = data["timeline_path"]
    output_path = timeline_path.replace(".otio", ".mp4")

    # Example: Use MLT's melt command for rendering (requires an MLT EDL/OTIO adapter)
    cmd = ["melt", timeline_path, "-consumer", f"avformat:{output_path}", "vcodec=libx264", "acodec=aac"]
    try:
        subprocess.check_call(cmd)
        return jsonify({"output": output_path})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/')
def index():
    return jsonify({"message": "FFmpeg Runner Server (Flask) is up!"})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8200)

