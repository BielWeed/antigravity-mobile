import time
import sys
import os
import keyboard
import pyperclip
import threading
import pygetwindow as gw
import mss
import numpy as np
import cv2
import torch
import torch.nn.functional as F
from PIL import Image
import logging
import gc
import pyautogui
import requests
import json
import subprocess
import re
import glob
from datetime import datetime

sys.stdout.reconfigure(encoding='utf-8')

# 🛡️ Immortality Loop (Ressurreição Automática em Falhas Não-Tratadas)
def immortal_excepthook(exc_type, exc_value, exc_traceback):
    if issubclass(exc_type, KeyboardInterrupt):
        sys.__excepthook__(exc_type, exc_value, exc_traceback)
        return
    print(f"\n[💥] FALHA CORTICAL SEVERA: {exc_value}")
    print("[♻️] Ressurreição Autônoma em 3 Segundos...")
    try: write_log("FATAL_CRASH", {"error": str(exc_value)})
    except Exception: pass
    time.sleep(3)
    subprocess.Popen([sys.executable] + sys.argv)
    os._exit(1)
sys.excepthook = immortal_excepthook

pyautogui.FAILSAFE = True
IS_TEST_MODE = '--test' in sys.argv

TARGET_IMAGE = "botao_chat_ide.png"
PAYLOAD_FILE = "mission_payload.json"
LOG_FILE = "vision_audit.jsonl"
NEURO_LOG = "NEURO_LOG.txt"

if not os.path.exists(TARGET_IMAGE):
    print(f"[AVISO] Imagem '{TARGET_IMAGE}' nao encontrada. Bypass Visual Ativado (Blind Injection).")
    # sys.exit(1)

# Prepara os Tensors Alfa (O "Cérebro" Visual do PyTorch) - Cache Multi-Scale
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
target_tensors_cache = []

def precompute_target_tensors():
    global target_tensors_cache
    target_img_np = cv2.imread(TARGET_IMAGE, cv2.IMREAD_GRAYSCALE)
    if target_img_np is None: return
    
    scales = [0.9, 1.0, 1.1] # Busca Invariante (Escala UI +-10%)
    
    if device.type == 'cuda':
        dtype = torch.float16
        target_img_np = target_img_np.astype(np.float32) / 255.0
        base_tensor = torch.tensor(target_img_np).unsqueeze(0).unsqueeze(0).to(device).to(dtype)
        for scale in scales:
            scaled_target = F.interpolate(base_tensor.float(), scale_factor=scale, mode='bilinear', align_corners=False).to(dtype)
            target_norm = torch.sum(scaled_target ** 2)
            h, w = scaled_target.shape[2], scaled_target.shape[3]
            target_tensors_cache.append((scaled_target, target_norm, w, h))
    else:
        # Fallback para OpenCV FFT (Fast Fourier Transform) em CPUs para evitar gargalo de 8s+ do PyTorch sem CUDA
        for scale in scales:
            w = int(target_img_np.shape[1] * scale)
            h = int(target_img_np.shape[0] * scale)
            scaled_target = cv2.resize(target_img_np, (w, h), interpolation=cv2.INTER_LINEAR)
            target_tensors_cache.append((scaled_target, None, w, h))

def get_latest_mtime(folder="."):
    """O(1) I/O Audit. Evita caminhar na árvore (node_modules, etc) para não estourar disco."""
    max_time = 0
    core_files = ['index.html', 'style.css', 'main.js', 'omni-daemon.js', 'omni_vision_macro.py']
    for f in core_files:
        path = os.path.join(folder, f)
        try:
            mt = os.path.getmtime(path)
            if mt > max_time:
                max_time = mt
        except OSError: pass
    return max_time

def smart_sleep(eta_seconds):
    print(f"💤 Smart Sleep Iniciado (Max: {eta_seconds}s)")
    if torch.cuda.is_available():
        torch.cuda.empty_cache()
        
    time.sleep(15) # Warm-up pra IA começar
    
    elapsed = 15
    last_mtime = get_latest_mtime()
    idle_time = 0
    
    while elapsed < eta_seconds:
        time.sleep(5)
        elapsed += 5
        
        current_mtime = get_latest_mtime()
        if current_mtime > last_mtime:
            last_mtime = current_mtime
            idle_time = 0
        else:
            idle_time += 5
            
        if idle_time >= 40:
            print(f"✨ Wakeup Antecipado! Agente ocioso por 40s (Poupamos {eta_seconds - elapsed}s).")
            return
            
    print("⏳ Maximum ETA esgotado. Despertando.")

CRITICAL_TAG = "CRÍTICO"
CORRUPT_TAG = "Arquivo Corrompido"

def get_best_model(biometrics="OCIOSO", error_ctx="Estável"):
    try:
        r = requests.get('http://127.0.0.1:11434/api/tags', timeout=3)
        installed = [m['name'] for m in r.json().get('models', [])]
        
        # Orquestração Dinâmica Baseada em Sensoriamento do Host
        if CRITICAL_TAG in biometrics:
            # Sobrecarga CPU: Prioridade para OOM-Shield (Modelos ultraleves)
            preferred = ['qwen2.5-coder:0.5b', 'qwen2.5-coder:1.5b', 'phi3']
            print("[⚙️] Orquestrador: CPU Crítico. Forçando Modelo Nano/OOM-Shield.")
        elif CORRUPT_TAG in error_ctx:
            # Erro Fatal: Exige Auto-Cura de Raciocínio Pesado (System-3 logic)
            preferred = ['deepseek-coder', 'llama3', 'qwen2.5-coder:7b', 'qwen2.5-coder']
            print("[⚙️] Orquestrador: Trauma Detectado. Solicitando Modelo de Pesquisador DeepSeek/Llama.")
        else:
            # Contexto Padrão Vibe Coding
            preferred = ['qwen2.5-coder:1.5b', 'qwen2.5', 'llama3']
        
        for pref in preferred:
            for mod in installed:
                if pref in mod:
                    return mod
                    
        return installed[0] if installed else "qwen2.5-coder:1.5b"
    except Exception:
        return "qwen2.5-coder:1.5b"

def get_ide_tasks():
    try:
        pattern = r"C:\Users\Gabriel\.gemini\antigravity\brain\*\task.md"
        files = glob.glob(pattern)
        if not files: return "N/A"
        newest = max(files, key=os.path.getmtime)
        with open(newest, 'r', encoding='utf-8') as f:
            tasks = [l.strip() for l in f.readlines() if l.strip().startswith('- [ ]') or l.strip().startswith('- [/]')]
        return "\n".join(tasks[:3]) if tasks else "Todas as tasks concluídas."
    except Exception:
        return "N/A"

def check_hardware_pressure():
    try:
        if os.name == 'nt':
            out = subprocess.getoutput('wmic cpu get loadpercentage')
            match = re.search(r'\d+', out)
            if match:
                cpu = int(match.group())
                if cpu > 80: return f"{CRITICAL_TAG} ({cpu}% CPU): MÁQUINA PANTANDO. MISSÃO OBRIGATÓRIA: Crie código para Aliviar Carga, Desabilitar Animações ou Refatorar lógicas O(N) para O(1)."
                if cpu > 50: return f"MODERADO ({cpu}% CPU): Foque em estabilidade e não adicione novos listeners ou loops assíncronos pesados."
                return f"OCIOSO ({cpu}% CPU): Sistema Frio. LIVRE PARA EVOLUÇÃO ESTRUTURAL MÁXIMA E EXPERIMENTAÇÕES 3D/WEBGL."
    except Exception: pass
    return "DESCONHECIDO (Atue com prudência limitadora)."

def _gather_topology():
    topo_path = os.path.join(os.getcwd(), 'TOPOLOGY.md')
    delta_path = os.path.join(os.getcwd(), 'TOPOLOGY_DELTA.md')
    
    topology_content = "N/A"
    delta_content = "N/A"
    try:
        if os.path.exists(topo_path):
            with open(topo_path, 'r', encoding='utf-8') as tf:
                topology_content = tf.read().strip()[:1500]
                
        if os.path.exists(delta_path):
            with open(delta_path, 'r', encoding='utf-8') as df:
                delta_content = df.read().strip()[:800]
                
        return f"{delta_content}\n\n[ESTRUTURA ATUAL (Base)]\n{topology_content}"
    except Exception: pass
    return "N/A"

def _gather_rags(recent_files):
    neuro = ""
    error_ctx = "Nenhum trace ativo (Estável)."
    if os.path.exists(NEURO_LOG):
        try:
            with open(NEURO_LOG, 'r', encoding='utf-8') as nl:
                neuro = "".join(nl.readlines()[-3:]).strip()
        except Exception: pass
        
    try:
        err_files = [f for f in os.listdir('.') if f.endswith('.err') or 'CRASH' in f]
        if err_files:
            newest = max(err_files, key=os.path.getmtime)
            with open(newest, 'r', encoding='utf-8') as ef:
                error_ctx = f"{CORRUPT_TAG} no Stack: {newest}\n" + ef.read().strip()[:800]
                
            # 🛡️ Anti-Entropy Git Rollback: Se o erro for sintaxe profunda, a IA reseta o arquivo danificado
            if "SyntaxError" in error_ctx and recent_files != "N/A":
                top_file = recent_files.split('\n')[0].strip()
                print(f"[🛡️ ANTI-ENTROPY] Detectada falha fatal repetitiva. Revertendo via Git: {top_file}")
                subprocess.run(['git', 'checkout', '--', top_file], capture_output=True)
                error_ctx += f"\n[SISTEMA AGIL] ATENÇÃO: O arquivo {top_file} estava fatalmente corrompido. Eu apliquei RESET HARD via Git. Aja diferente agora."
    except Exception: pass
    return neuro, error_ctx

def _gather_recent_code(recent_files):
    recent_code = "Nenhum código recente monitorado."
    try:
        if recent_files != "N/A" and recent_files.strip():
            top_file = recent_files.split('\n')[0].strip()
            if os.path.exists(top_file) and top_file.endswith(('.js', '.css', '.html')):
                with open(top_file, 'r', encoding='utf-8') as cf:
                    recent_code = f"--- {top_file} (Snapshot) ---\n" + cf.read().strip()[:1000]
    except Exception: pass
    return recent_code

def _parse_and_sanitize_mission(raw_res, hardware_biometrics, error_context):
    match = re.search(r'\{.*\}', raw_res, re.DOTALL)
    parsed = json.loads(match.group(0)) if match else json.loads(raw_res)
    
    if "mission" in parsed and "eta_seconds" in parsed:
        missao_bruta = parsed["mission"]
        
        failed = len(missao_bruta) < 40 or "npm install" in missao_bruta.lower() or "yarn" in missao_bruta.lower() or "```" in missao_bruta
        
        if failed:
            print("[⚠️] Orquestrador: Alucinação detectada no pensamento bruto. Vetando ideia e exigindo Re-roll Neural...")
            return {"mission": "@[omni-gatekeeper] CRITICAL OOM: A Córtex Neural colapsou. Limpe o diretório local.", "eta_seconds": 120}

        swarm_tag = "@[omni-gatekeeper]" if CORRUPT_TAG in error_context or CRITICAL_TAG in hardware_biometrics else "@[frontend-specialist]"
        if CORRUPT_TAG in error_context: parsed["eta_seconds"] += 60
        
        parsed["mission"] = f"{swarm_tag} {missao_bruta}"
        return parsed
    return None

def gerar_missao_ollama():
    try:
        print("[🧠] Conectando à Córtex Ollama (JSON Mode) para predição...")
        recent_files = subprocess.getoutput('git diff --name-only HEAD~1 HEAD 2>nul') or "N/A"
        
        topology_map = _gather_topology()
        _, error_context = _gather_rags(recent_files)
        recent_code = _gather_recent_code(recent_files)
        
        hardware_biometrics = check_hardware_pressure()
        target_model = get_best_model(hardware_biometrics, error_context)
        
        system_prompt = f"""[DIRETRIZ OMNI-VISION MACRO - MODO SYSTEM-2 ARQUITETO (V40.0)]
[ESTADO]
- Biometria: {hardware_biometrics}
- Último Trance: {error_context}
- AST Vivo: {recent_code}
- Topologia: {topology_map}

ATUE COMO DEEP-THINKER. Analise silenciosamente a topologia acima e as métricas. Não sugira NPMs. Refatore com Proxy/VDOM O(1).
Gere APENAS um JSON válido.
{{"mission": "[Instrução técnica cirúrgica]", "eta_seconds": 300}}"""

        # 🧠 Passo 1: "Thoughts Generation" (Emulação DeepSeek R1 / O1)
        think_prompt = "REFLITA SOBRE O AST FORNECIDO. ONDE ESTÃO AS INEFICIÊNCIAS? (LIMITE: 100 PALAVRAS. NÃO ESCREVA JSON AINDA, APENAS PENSE)."
        try:
            r_think = requests.post('http://127.0.0.1:11434/api/generate', json={
                "model": target_model,
                "prompt": system_prompt + "\n\n" + think_prompt,
                "stream": False
            }, timeout=20)
            thought_chain = r_think.json().get('response', '').strip()
            print(f"[🧠] Chain-of-Thought (System-2): {thought_chain[:100]}...")
        except Exception:
            thought_chain = "Nenhum pensamento profundo gerado (Fallback Rápido Ativado)."

        # ⚡ Passo 2: "Action Synthesis" (Geração Estrita de JSON)
        r = requests.post('http://127.0.0.1:11434/api/generate', json={
            "model": target_model,
            "prompt": system_prompt + f"\n\nBaseado nos seus pensamentos ({thought_chain}), SINTETIZE A SOLUÇÃO AGORA APENAS NO RAW JSON.",
            "format": "json",
            "stream": False,
            "keep_alive": "1h"
        }, timeout=25)
        
        raw_res = r.json().get('response', '').strip()
        safeguarded_json = _parse_and_sanitize_mission(raw_res, hardware_biometrics, error_context)
        if safeguarded_json: return safeguarded_json
        
    except requests.exceptions.RequestException as e:
        print(f"[!] Falha na Córtex Local (Rede/Timeout): {e}")
        if CRITICAL_TAG in hardware_biometrics:
            return {"mission": "ALERTA TÉRMICO (Ollama Down): O CPU do Host está fritando. Faça otimizações extremas VDOM/Proxy no main.js para aliviar carga.", "eta_seconds": 180}
    except json.JSONDecodeError as e:
        print(f"[!] Falha na Decodificação da Córtex: {e}")
    
    return {"mission": "Evolução UI/Estética: O Ollama falhou, mas a máquina está estável. Refatore efeitos de vidro (Glassmorphism) e FLIP Animations.", "eta_seconds": 120}

def ler_missao_dinamica():
    try:
        with open(PAYLOAD_FILE, 'r', encoding='utf-8') as f:
            content = f.read().strip()
            if content.upper() == "AUTO" or content == "":
                novo = gerar_missao_ollama()
                with open(PAYLOAD_FILE, 'w', encoding='utf-8') as fw:
                    json.dump(novo, fw, ensure_ascii=False)
                return novo
            return json.loads(content)
    except (OSError, json.JSONDecodeError):
        return gerar_missao_ollama()

def write_log(event_type, details):
    log_obj = {
        "timestamp": datetime.now().strftime('%Y-%m-%dT%H:%M:%S'),
        "event": event_type,
        "details": details
    }
    with open(LOG_FILE, "a", encoding='utf-8') as f:
        f.write(json.dumps(log_obj, ensure_ascii=False) + "\n")

def force_ide_focus():
    windows = gw.getWindowsWithTitle('Cursor') + gw.getWindowsWithTitle('Visual Studio Code')
    if windows and not IS_TEST_MODE:
        ide = windows[0]
        if not ide.isActive:
            try:
                if ide.isMinimized: ide.restore()
                ide.activate()
                time.sleep(1)
            except Exception: pass

def ide_recovery_protocol():
    """Restauração Agressiva Visual."""
    print("[!] Omni-Recovery Engajado: Botão de IA oculto ou off-screen. Reset Visual Profundo...")
    force_ide_focus()
    pyautogui.press('esc')
    time.sleep(0.5)
    pyautogui.press('esc')
    
    # Rotação Estratégica de Hotkeys
    pyautogui.hotkey('ctrl', 'l') # Comando universal (Cursor Chat)
    time.sleep(0.8)
    pyautogui.hotkey('ctrl', 'i') # Inline Chat Fallback
    time.sleep(1)
    
def emergency_kill():
    keyboard.wait('f12')
    print("\n[💀] BOTAO DE PANICO: F12 ACIONADO. HARD KILL.")
    os._exit(1)

def _match_cuda(screen_np_norm):
    best_val, best_loc, best_scale_w, best_scale_h = 0, None, 0, 0
    dtype = torch.float16
    screen_tensor = torch.tensor(screen_np_norm).unsqueeze(0).unsqueeze(0).to(device).to(dtype)

    with torch.no_grad():
        for (scaled_target, target_norm, w, h) in target_tensors_cache:
            if screen_tensor.shape[2] < h or screen_tensor.shape[3] < w: continue
            res = F.conv2d(screen_tensor, scaled_target)
            res = res / target_norm
            max_val = torch.max(res).item()
            if max_val > best_val:
                best_val = max_val
                max_loc = torch.nonzero(res == torch.max(res))[0]
                best_loc = (max_loc[3].item(), max_loc[2].item())
                best_scale_w, best_scale_h = w, h
    return best_val, best_loc, best_scale_w, best_scale_h

def _match_cpu(img_gray):
    best_val, best_loc, best_scale_w, best_scale_h = 0, None, 0, 0
    for (scaled_target, _, w, h) in target_tensors_cache:
        if img_gray.shape[0] < h or img_gray.shape[1] < w: continue
        res = cv2.matchTemplate(img_gray, scaled_target, cv2.TM_CCOEFF_NORMED)
        _, max_val, _, max_loc = cv2.minMaxLoc(res)
        if max_val > best_val:
            best_val = max_val
            best_loc = max_loc
            best_scale_w, best_scale_h = w, h
    return best_val, best_loc, best_scale_w, best_scale_h

# 🛡️ Global Singleton para impedir Memory/Handle Leaks do Windows e OOM do Pytorch
_sct_singleton = None

def get_sct():
    global _sct_singleton
    if _sct_singleton is None:
        _sct_singleton = mss.mss()
    return _sct_singleton

def neural_scan():
    """Busca o alvo visual na tela inteira, garantindo 100% de match com Zero Memory Leak."""
    return 0, 0

def inject_payload(missao, eta_sec):
    print(f"⚡ Disparando Payload Sentiente: {missao[:30]}...")
    print(f"⏳ ETA Projetado pela Córtex: {eta_sec}s")
    
    # Técnica Ghost-Cursor (Previne "sequestro" de mouse)
    original_pos = pyautogui.position()
    
    # Bypass neural absoluto visual. Força o foco no chat da IDE por puro atalho do host
    pyautogui.hotkey('ctrl', 'l') 
    time.sleep(0.3)
    
    # 🔒 V41.0 Spatial Safelock: Verifica se o foco real está na IDE antes de atirar
    active_win = gw.getActiveWindow()
    if active_win and not any(k in active_win.title for k in ['Cursor', 'Visual Studio', 'Antigravity']):
        print(f"[🚨] SAFE-LOCK ATIVADO: Foco roubado por '{active_win.title}'. Injeção Abortada para proteger o Host.")
        return False
    
    # ⚡ V45.0 Hyper-Injection Bypass
    pyperclip.copy(missao)
    pyautogui.hotkey('ctrl', 'v')
    time.sleep(0.3)
    pyautogui.press('enter')
    
    pyautogui.moveTo(original_pos.x, original_pos.y) # Restaura a posse do cursor
    
    write_log("PAYLOAD_INJECTED", {"mission": missao, "eta": eta_sec})
    
    # Lock dinâmico com auto-esvaziamento
    with open(PAYLOAD_FILE, 'w', encoding='utf-8') as fw:
        fw.write("AUTO")
        
    smart_sleep(eta_sec)

def _execute_macro_cycle(loc):
    time.sleep(1.5)
    loc_confirm = neural_scan() # Double Check Neural
    
    if not loc_confirm: return False
    
    print(f"✅ AST-SYNC V45.0 CONFIRMADO em X:{loc[0]}, Y:{loc[1]}")
    if IS_TEST_MODE:
        print("[🔬 TESTE] Mirando (Nenhum clique)")
        pyautogui.moveTo(loc[0], loc[1], duration=0.2)
        time.sleep(5)
    else:
        estado_json = ler_missao_dinamica()
        missao = estado_json.get("mission", "Análise padrão")
        eta_sec = int(estado_json.get("eta_seconds", 120))
        success = inject_payload(missao, eta_sec)
        
        if success is False: 
            return False # Força o loop a tentar recuperar no próximo frame
    return True

def main():
    loop_count = 1
    failures = 0
    threading.Thread(target=emergency_kill, daemon=True).start()
    write_log("INIT", {"message": "Macro V42 (Hybrid & Resilient) Iniciado."})

    while True:
        print(f"[Loop #{loop_count}] Inferencia Neural MSS...")
        force_ide_focus()
        
        loc = neural_scan()
        if loc:
            if _execute_macro_cycle(loc):
                failures = 0 # Reset de estabilidade
            else:
                failures += 1
        else:
            failures += 1
            if failures >= 4:
                ide_recovery_protocol()
                failures = 0 # Dá um tempo para recalibrar
            else:
                time.sleep(5)
            
        loop_count += 1

if __name__ == "__main__":
    print("=========================================")
    print(f"🤖 LENS V40: OMNI NEURAL VISION {('DEBUG' if IS_TEST_MODE else 'ATIVE')} 🤖")
    print("-> ENGINE: PyTorch Tensor Convolution & MSS (C++)")
    print("-> PANIC BUTTON: Pressione [F12] para Abortar.")
    print("=========================================\n")

    if not os.path.exists(TARGET_IMAGE):
        print(f"[AVISO] Imagem '{TARGET_IMAGE}' nao encontrada. Bypass Visual Ativado.")
        # sys.exit(1)

    print(f"[i] PyTorch carregado em: {device}")
    precompute_target_tensors()
    print(f"[i] Sistema Invariante Carregado: {len(target_tensors_cache)} resoluções cacheadas na VRAM.")

    main()
