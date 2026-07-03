import json
import urllib.request
import urllib.error
import os

SETTINGS_FILE = "settings.json"

def get_whatsapp_settings():
    if not os.path.exists(SETTINGS_FILE):
        return {}
    try:
        with open(SETTINGS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}

def send_whatsapp_message(message: str) -> dict:
    settings = get_whatsapp_settings()
    enabled = settings.get("whatsapp_enabled", False)
    if not enabled:
        return {"status": "disabled", "message": "WhatsApp alerts are disabled"}
    
    url = settings.get("evolution_api_url", "http://localhost:8080").rstrip("/")
    api_key = settings.get("evolution_api_key", "your_api_key")
    instance = settings.get("evolution_instance_name", "mcqs_instance")
    recipient = settings.get("whatsapp_recipient", "")
    
    if not recipient:
        return {"status": "error", "message": "No recipient phone number configured"}
    
    # Format the number: remove any +, spaces, dashes.
    clean_number = "".join(filter(str.isdigit, recipient))
    if not clean_number:
        return {"status": "error", "message": "Invalid recipient phone number"}

    # Evolution API endpoint to send text
    endpoint = f"{url}/message/sendText/{instance}"
    
    headers = {
        "Content-Type": "application/json",
        "apikey": api_key
    }
    
    payload = {
        "number": clean_number,
        "options": {
            "delay": 1000,
            "presence": "composing",
            "linkPreview": False
        },
        "textMessage": {
            "text": message
        }
    }
    
    try:
        req = urllib.request.Request(
            endpoint,
            data=json.dumps(payload).encode("utf-8"),
            headers=headers,
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=5) as response:
            res_data = response.read().decode("utf-8")
            return {
                "status": "success",
                "message": "Message sent successfully",
                "response": json.loads(res_data)
            }
    except urllib.error.HTTPError as e:
        try:
            err_msg = e.read().decode("utf-8")
            err_json = json.loads(err_msg)
        except Exception:
            err_json = str(e)
        return {
            "status": "error",
            "message": f"HTTP Error {e.code}",
            "detail": err_json
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Connection error: {str(e)}"
        }
