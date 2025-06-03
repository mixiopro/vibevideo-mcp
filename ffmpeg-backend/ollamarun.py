import requests
import json

NODE_API = "http://localhost:8300"

# --- 1. Get available tools and tool descriptions at startup ---

def fetch_tools_and_descriptions():
    # List of tool names
    tools_resp = requests.get(f"{NODE_API}/api/list-tools")
    tools = tools_resp.json()["tools"]

    # Descriptions (with schema)
    tool_meta = {}
    for name in tools:
        desc_resp = requests.get(f"{NODE_API}/api/describe-tool/{name}")
        if desc_resp.ok:
            tool_meta[name] = desc_resp.json()
    return tools, tool_meta

TOOLS, TOOL_META = fetch_tools_and_descriptions()

# --- 2. Map tool name to endpoint pattern ---
def call_tool(tool_name, **kwargs):
    if tool_name not in TOOL_META:
        raise ValueError(f"Unknown tool: {tool_name}")

    endpoint = TOOL_META[tool_name].get("route")
    if not endpoint:
        raise ValueError(f"No route defined for tool: {tool_name}")
    url = f"{NODE_API}{endpoint}"
    resp = requests.post(url, json=kwargs)
    try:
        result = resp.json()
    except Exception as e:
        print(f"[ERROR] Could not parse JSON response: {e} -- {resp.text}")
        raise RuntimeError(f"Tool {tool_name} failed: Could not parse response.")
    if not resp.ok:
        raise RuntimeError(f"Tool {tool_name} failed: {resp.text}")
    if "error" in result:
        raise RuntimeError(f"Tool {tool_name} failed: {result['error']}")
    return result


# --- 3. Build functions array for prompt dynamically from tool meta ---
def build_functions_for_llm(tool_meta):
    out = []
    for tool in tool_meta.values():
        # Compose OpenAI function spec
        f = {
            "name": tool["name"],
            "description": tool.get("description", ""),
            "parameters": tool.get("parameters", {})
        }
        out.append(f)
    return out

# --- 4. Generate system prompt from tool metadata ---
def build_instruction(tool_meta):
    tool_lines = []
    for tool in tool_meta.values():
        params = ""
        # Parameters may be a list (your current format)
        if isinstance(tool.get("parameters"), list):
            params = ", ".join(
                p.get("name", str(p)) if isinstance(p, dict) else str(p)
                for p in tool["parameters"]
            )
        # Parameters may be a dict with OpenAI-style { properties: ... }
        elif isinstance(tool.get("parameters"), dict) and "properties" in tool["parameters"]:
            params = ", ".join(tool["parameters"]["properties"].keys())
        # Parameters may be missing or empty
        else:
            params = ""
        tool_lines.append(f'- {tool["name"]}({params})')
    return (
        "You are an API assistant. You have access to ONLY these tools. "
        "Use EXACTLY the function names and argument names as shown. "
        "Never invent or reword the names. "
        "Valid tools:\n" +
        "\n".join(tool_lines) +
        "\nWhen the user asks for an operation, ALWAYS reply with ONLY a single line of valid JSON, exactly like this:\n"
        "{\"function_call\": {\"name\": \"<function_name>\", \"arguments\": { ... }}}\n"
        "Never include explanations, code blocks, markdown, or stray text. Only reply with raw JSON. "
        "If you do not recognize the operation, reply: {\"function_call\": {\"name\": null, \"arguments\": {}}}"
        "For generateFilterLabCommand, only use:  - inputFilename (string) - filters (array of string, e.g. [\"hue\"]) - parameterValues (object: { \"hue\": { \"h\": 0 } }) // adjust keys/values per filter docs. "
        "Do NOT include availableFiltersData in the function arguments."
    )

INSTRUCTION = build_instruction(TOOL_META)

MODEL = "qwen3:latest"  # Or any model from your list

def extract_function_call(msg):
    content = msg.get("content", "")
    # ... (unchanged code from your function)
    if content.startswith("```") or content.startswith("~~~"):
        content = content.strip().split('\n', 1)[-1]
        if content.endswith("```") or content.endswith("~~~"):
            content = content.rsplit('\n', 1)[0]
    lines = content.split('\n')
    json_lines = []
    for line in lines:
        if "{" in line and "function_call" in line:
            json_lines.append(line[line.index('{'):])
        elif json_lines:
            json_lines.append(line)
            if "}" in line:
                break
    try:
        if json_lines:
            cleaned = "\n".join(json_lines)
        else:
            cleaned = content
        start = cleaned.find('{')
        end = cleaned.rfind('}')
        if start >= 0 and end >= 0:
            call = json.loads(cleaned[start:end+1])
            return call.get("function_call")
        call = json.loads(cleaned)
        return call.get("function_call")
    except Exception as e:
        print(f"[WARN] Could not parse JSON function call: {e}\nContent: {content}")
        return None

def main():
    print("Ask me to do something with your video files, e.g.:")
    for tool in TOOL_META.values():
        print(f"  - {tool.get('description', tool['name'])}")
    print("Ctrl+C to exit.\n")

    while True:
        prompt = input("Task: ")
        if not prompt.strip():
            continue

        OLLAMA_API_URL = "http://localhost:11434/v1/chat/completions"
        payload = {
            "model": MODEL,
            "messages": [
                {"role": "system", "content": INSTRUCTION},
                {"role": "user", "content": prompt}
            ],
            "stream": False
        }

        resp = requests.post(OLLAMA_API_URL, json=payload)
        if not resp.ok:
            print(f"Ollama API error: {resp.status_code} {resp.text}")
            continue

        response = resp.json()
        print("Raw Ollama response:", json.dumps(response, indent=2))  # DEBUG

        msg = response.get("message")
        if msg is None and "choices" in response and len(response["choices"]):
            msg = response["choices"][0].get("message")
        if msg is None and "messages" in response and len(response["messages"]):
            msg = response["messages"][0]
        if msg is None:
            print("No usable 'message' found in Ollama response.")
            continue

        fc = extract_function_call(msg)
        if not fc:
            print("No valid function_call found in response.")
            print(f"LLM response: {msg.get('content', '[no content in response]')}")
            continue

        fn_name = fc.get("name")
        args = fc.get("arguments", {})
        print(f"→ LLM wants to call {fn_name} with {args}")
        try:
            tool_result = call_tool(fn_name, **args)
            print(f"← MCP response: {json.dumps(tool_result, indent=2)}")
        except Exception as e:
            print(f"Error calling tool {fn_name}: {e}")

if __name__ == "__main__":
    main()



# import requests
# import ollama
# import json

# # ---- MCP TOOL WRAPPERS ----

# NODE_API = "http://localhost:8300"

# def generate_trim_command(inputFilename, start, end):
#     url = f"{NODE_API}/api/generate-trim-command"
#     payload = {"inputFilename": inputFilename, "start": start, "end": end}
#     r = requests.post(url, json=payload)
#     return r.json()

# def generate_framerate_command(inputFilename, frameRate):
#     url = f"{NODE_API}/api/generate-framerate-command"
#     payload = {"inputFilename": inputFilename, "frameRate": frameRate}
#     r = requests.post(url, json=payload)
#     return r.json()

# def generate_gifwebp_command(inputFilename, startTime, duration, format, scaleHeight, fps):
#     url = f"{NODE_API}/api/generate-gifwebp-command"
#     payload = {
#         "inputFilename": inputFilename,
#         "startTime": startTime,
#         "duration": duration,
#         "format": format,
#         "scaleHeight": scaleHeight,
#         "fps": fps
#     }
#     r = requests.post(url, json=payload)
#     return r.json()

# # ---- FUNCTION SPEC FOR MCP (for documentation, not sent to Ollama) ----

# functions = [
#     {
#         "name": "generate_trim_command",
#         "description": "Trim a video file to the specified start and end times using ffmpeg.",
#         "parameters": {
#             "type": "object",
#             "properties": {
#                 "inputFilename": {"type": "string", "description": "Name of the video file."},
#                 "start": {"type": "string", "description": "Start time (e.g., 00:00:01)"},
#                 "end": {"type": "string", "description": "End time (e.g., 00:00:02.5)"}
#             },
#             "required": ["inputFilename", "start", "end"]
#         }
#     },
#     {
#         "name": "generate_framerate_command",
#         "description": "Change the framerate of a video file using ffmpeg.",
#         "parameters": {
#             "type": "object",
#             "properties": {
#                 "inputFilename": {"type": "string"},
#                 "frameRate": {"type": "string", "description": "Target framerate (e.g., 24)"}
#             },
#             "required": ["inputFilename", "frameRate"]
#         }
#     },
#     {
#         "name": "generate_gifwebp_command",
#         "description": "Convert a video segment to a GIF or WebP.",
#         "parameters": {
#             "type": "object",
#             "properties": {
#                 "inputFilename": {"type": "string"},
#                 "startTime": {"type": "string"},
#                 "duration": {"type": "string"},
#                 "format": {"type": "string", "enum": ["gif", "webp"]},
#                 "scaleHeight": {"type": "integer"},
#                 "fps": {"type": "integer"}
#             },
#             "required": ["inputFilename", "startTime", "duration", "format", "scaleHeight", "fps"]
#         }
#     }
# ]

# fn_map = {
#     "generate_trim_command": generate_trim_command,
#     "generate_framerate_command": generate_framerate_command,
#     "generate_gifwebp_command": generate_gifwebp_command,
# }

# MODEL = "qwen3:latest"  # Or any model from your list

# INSTRUCTION = (
#     "You are an API assistant. You have access to ONLY these three tools. "
#     "Use EXACTLY the function names and argument names as shown. "
#     "Never invent or reword the names. "
#     "If you deviate, your answer will be discarded. "
#     "Valid tools:\n"
#     "- generate_trim_command(inputFilename, start, end)\n"
#     "- generate_framerate_command(inputFilename, frameRate)\n"
#     "- generate_gifwebp_command(inputFilename, startTime, duration, format, scaleHeight, fps)\n"
#     "When the user asks for an operation, ALWAYS reply with ONLY a single line of valid JSON, exactly like this:\n"
#     "{\"function_call\": {\"name\": \"<function_name>\", \"arguments\": { ... }}}\n"
#     "Never include explanations, code blocks, markdown, or stray text. Only reply with raw JSON. "
#     "If you do not recognize the operation, reply: {\"function_call\": {\"name\": null, \"arguments\": {}}}"
# )

# def extract_function_call(msg):
#     """
#     Extracts function_call JSON from msg content, robust against code blocks, markdown, and text.
#     """
#     content = msg.get("content", "")
#     # 1. Remove code block wrappers if present
#     if content.startswith("```") or content.startswith("~~~"):
#         content = content.strip().split('\n', 1)[-1]
#         if content.endswith("```") or content.endswith("~~~"):
#             content = content.rsplit('\n', 1)[0]
#     # 2. Remove any markdown or apology/explanation lines
#     lines = content.split('\n')
#     json_lines = []
#     for line in lines:
#         if "{" in line and "function_call" in line:
#             # likely start of the real output
#             json_lines.append(line[line.index('{'):])
#         elif json_lines:
#             # append following lines, until first closing brace found
#             json_lines.append(line)
#             if "}" in line:
#                 break
#     # 3. Try to extract JSON from the collected lines
#     try:
#         if json_lines:
#             cleaned = "\n".join(json_lines)
#         else:
#             # fallback: just try the content
#             cleaned = content
#         # Find first { and last }
#         start = cleaned.find('{')
#         end = cleaned.rfind('}')
#         if start >= 0 and end >= 0:
#             call = json.loads(cleaned[start:end+1])
#             return call.get("function_call")
#         # Last resort, try parsing whole string
#         call = json.loads(cleaned)
#         return call.get("function_call")
#     except Exception as e:
#         print(f"[WARN] Could not parse JSON function call: {e}\nContent: {content}")
#         return None

# def main():
#     print("Ask me to do something with your video files, e.g.:")
#     print("  - 'Trim justHi.mov from 00:00:01 to 00:00:02.5'")
#     print("  - 'Convert justHi.mov to a GIF, starting at 00:00:01, duration 2 seconds'")
#     print("  - 'Set justHi.mov framerate to 24'")
#     print("Ctrl+C to exit.\n")

#     while True:
#         prompt = input("Task: ")
#         if not prompt.strip():
#             continue

#         OLLAMA_API_URL = "http://localhost:11434/v1/chat/completions"
#         payload = {
#             "model": MODEL,
#             "messages": [
#                 {"role": "system", "content": INSTRUCTION},
#                 {"role": "user", "content": prompt}
#             ],
#             "stream": False
#         }

#         resp = requests.post(OLLAMA_API_URL, json=payload)
#         if not resp.ok:
#             print(f"Ollama API error: {resp.status_code} {resp.text}")
#             continue

#         response = resp.json()
#         print("Raw Ollama response:", json.dumps(response, indent=2))  # DEBUG

#         # OpenAI style: single "message"
#         msg = response.get("message")
#         # Ollama/Crew style: "choices" list
#         if msg is None and "choices" in response and len(response["choices"]):
#             msg = response["choices"][0].get("message")
#         # Some other models: "messages" list
#         if msg is None and "messages" in response and len(response["messages"]):
#             msg = response["messages"][0]
#         if msg is None:
#             print("No usable 'message' found in Ollama response.")
#             continue

#         # ---- New: Always expect LLM JSON output with "function_call" ----
#         fc = extract_function_call(msg)
#         if not fc:
#             print("No valid function_call found in response.")
#             print(f"LLM response: {msg.get('content', '[no content in response]')}")
#             continue

#         fn_name = fc.get("name")
#         args = fc.get("arguments", {})
#         print(f"→ LLM wants to call {fn_name} with {args}")
#         tool_fn = fn_map.get(fn_name)
#         if not tool_fn:
#             print(f"Unknown tool: {fn_name}")
#             continue
#         tool_result = tool_fn(**args)
#         print(f"← MCP response: {json.dumps(tool_result, indent=2)}")

# if __name__ == "__main__":
#     main()


