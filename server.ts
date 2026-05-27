import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "motora-secret-troque-em-producao";

const DB_PATH = process.env.DB_PATH || "data.db";

// --- Database Setup ---
let db: Database.Database;
try {
  console.log(`Initializing database at: ${path.resolve(DB_PATH)}`);
  db = new Database(DB_PATH);
} catch (err: any) {
  console.error("FAILED TO OPEN DATABASE:", err);
  // Fallback to memory for safety during build/dev if file fails, 
  // but this is not ideal for persistence.
  console.warn("Falling back to in-memory database. Changes will NOT persist.");
  db = new Database(":memory:");
}

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    is_admin INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS knowledge (
    id INTEGER PRIMARY KEY,
    content TEXT NOT NULL DEFAULT '',
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_by TEXT DEFAULT 'system'
  );
  CREATE TABLE IF NOT EXISTS chat_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    user_message TEXT NOT NULL,
    bot_message TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

// Defaut Knowledge Base (KB)
const DEFAULT_KB = `## ARQUITETURA DO SISTEMA
Hardware: Raspberry Pi (rpi3b) com câmeras externa (ADAS) e interna (DSM/fadiga)
... (truncated for brevity in setup, we'll use the full version in the actual insert)
`;

// Insert full KB and admin from user request logic
const INITIAL_KB_CONTENT = `## 🧠 DIRETRIZES DE ESPECIALISTA (COMPORTAMENTO/APRENDIZADO)
- Se o admin definir "não faça assim, faça desse jeito", esta regra deve ser respeitada acima de qualquer padrão genérico.
- Priorize sempre o diagnóstico remoto. Se for impossível resolver via software, recomende a troca física do cabo flat ou do equipamento (Kernel Panic).

## 🏢 GESTÃO DE EMPRESAS E CLIENTES
- **White Martins (WM)**: Empresa multi-unidade. Cada unidade (ex: WM - Jundiaí CDL) deve ser tratada como filial da WM, respeitando processos globais mas identificando a unidade.

## 💻 CONFIGURAÇÃO DE AMBIENTE LOCAL (LINUX)
Esta é a configuração necessária para técnicos configurarem um Linux novo para ter acesso ao equipamento (Setup Único):

### Passo 1: Configurar rotas de proxy no SSH (~/.ssh/config)
\`\`\`bash
Host *.remotify.driveranalytics.com.br
  CheckHostIP no
  ProxyCommand /bin/nc -X connect -x %h:80 %h %p

Host *.remotify.dev.driveranalytics.com.br
  CheckHostIP no
  ProxyCommand /bin/nc -X connect -x %h:80 %h %p

Host *.frps.driveranalytics.com.br
  CheckHostIP no
  ProxyCommand socat - PROXY:tunnel.driveranalytics.com.br:%h:22,proxyport=1337

Host *.frps.dev.driveranalytics.com.br
  CheckHostIP no
  ProxyCommand socat - PROXY:tunnel.dev.driveranalytics.com.br:%h:22,proxyport=1337
\`\`\`

### Passo 2: Inserir as funções de atalho no Bash (~/.bashrc)
O técnico deve adicionar as funções \`remotify\` e \`frp\` ao final do seu .bashrc e então executar \`source ~/.bashrc\`.
- \`remotify [placa] [ambiente] [camera]\`: Acesso via proxy SSH.
- \`frp [placa] [ambiente] [camera]\`: Acesso via tunnel FRP.
- Parâmetros: 0=externa, 1=interna, 2=extra | ambiente: prod ou dev.

## ARQUITETURA DO SISTEMA
Hardware: Raspberry Pi (rpi3b) com câmeras externa (ADAS) e interna (DSM/fadiga)
Comunicação: módulo LTE/4G (wvdial), GPS serial (/dev/serial0), WiFi (wlan0), Ethernet (eth0)
Rede interna: câmera externa IP 10.0.90.195, câmera interna IP 10.0.90.196 
Rede Cabeada: câmera externa IP 10.0.89.195, câmera interna IP 10.0.89.196
Credenciais SSH: usuário pi, senha rpi#8989
Credenciais web config: usuário motora, senha Calib#8989

## INFORMACOES UTEIS
- O técnico em campo não pode abrir o equipamento. Caso o problema exija que o KIT seja aberto de alguma forma, a troca é solicitada e ele é consertado na base da Motora. Deve-se esclarecer se o diagnóstico está sendo feito remotamente + técnico em campo, ou se é um diagnóstico físico.

- Se um carro não gera viagem, primeiro verificamos se está ligado e com sinal bom e então, se conseguimos acessar, caso haja acesso, verificamos todas as informações de logs. Senão, verificamos elétrica, conectores, se há algum sinal, etc.

- CONEXÃO: Existem duas formas principais:
  1. REMOTA (FRP/Web): Depende de sinal LTE e funcionamento do sistema.
  2. DIRETA (AnyDesk/Cabo): Conexão física via computador ligado diretamente na câmera (Externa ou Interna).
- CONFIGURAÇÃO DE REDE (PC/AnyDesk): Se o computador nunca acessou o equipamento, deve-se configurar o IPv4 manualmente:
  - IP: 10.0.89.3
  - Máscara: 255.255.255.0
  - Gateway: 10.0.89.2
- INFERÊNCIA: Se houver acesso remoto, assume-se que LTE=Connected e POWER=OK. Se houver acesso via AnyDesk mas não remoto, o problema é provavelmente na rede/VPN/LTE.

- EMPRESAS (CLIENTES):
  - White Martins (WM): Possui diversas unidades. Nomenclatura padrão: 'WM - [Local] [PKG/CDL]'. Todas devem ser tratadas como filiais da empresa maior WM, mantendo a especificidade da unidade mas seguindo os padrões globais da WM.

- DIAGNÓSTICO DE CÂMERA (CRÍTICO): Se os logs da câmera mostrarem a imagem piscando em preto e branco sem parar, o problema é Kernel Panic ou falha no cabo flat. 
  - AÇÃO: Não há reparo via software. Solicitar a troca imediata do equipamento.

- ARMAZENAMENTO E LOGS: O sistema utiliza rotação de logs (FIFO). Quando o limite de espaço é atingido, os logs mais antigos são sobrescritos/apagados. 
  - Alerta: Alguns logs de gravação (recorder) podem crescer rápido; use os comandos de \`find\` e \`truncate\` da seção de Disco se o armazenamento estiver acima de 90%.

## ACESSO REMOTO
Via FRP (terminal Linux):
  frp [placa] [ambiente] [câmera]
  Exemplo: frp ABC1234 prod 0 (externa), frp ABC1234 prod 1 (interna)
  câmera: 0=externa, 1=interna, 2=extra | ambiente: prod ou dev

Via web (navegador):
  Config: https://PLACA_externa.frps.driveranalytics.com.br/config/
  Shell:  https://PLACA_externa.frps.driveranalytics.com.br/shell/

SSH direto:
  sshpass -p "rpi#8989" ssh pi@PLACA_externa_ssh.frps.driveranalytics.com.br

Câmera interna pela externa:
  ping 10.0.90.196
  ssh 10.0.90.196

## DIAGNÓSTICO: EQUIPAMENTO OFFLINE
Nível 1 - Preliminar:
  - Aguardar 5 min de uptime (inicialização completa)
  - Veículo em área aberta (GPS e LTE precisam de sinal)
  - Testar acesso via navegador: se carregar → energia + boot + rede OK

Nível 2 - Inspeção elétrica:
  - LEDs apagados/silencioso → falha elétrica. Verificar fusível.
    Fiação: amarelo=pós-chave, vermelho=positivo contínuo, preto=GND, branco/laranja=isolado
  - Display pedindo "ID" com LED RFID aceso → sistema funcionando
  - Display com Luz azul do gps acesa, problema é sistema/LTE/câmera

Nível 3 - Diagnóstico via terminal:
  A) GPS: cat /dev/serial0 | grep -ia gsa (A,1=sem sinal | A,3=com sinal)
  B) LTE: sudo service internet_service stop → sudo minicom -D /dev/ttyLTE → AT → AT+cmee=2 → AT+cpin? (se resultado for sim not inserted no ultimo: chip esta danificado ou mau inserido = trocar aparelho)
  C) Câmera: cat .driveranalytics/logs/current/camera.log # se a camera externa não funcionar, não terá viagem
  D) Tagger: cat .driver_analytics/logs/current/tagger.log 

  A ordem de verificação sempre é gps -> camera -> tagger

Problemas gerais:
  - API errada:
    sqlite3 .driver_analytics/database/driveranalytics.db #usuario e senha devem estar conforme o portal
  - Erro na atualização:
    ls -la # verificar se o arquivo .driver_analytics não está zerado. se sim, forçar atualização do sistema
    ls -la .driver_analytics/bin/ # verificar se os binarios não estão zerados, se sim, tambem atualizar
    
## COMANDOS PRINCIPAIS
Serviços:
  sudo service cbi_startup stop     # para todos os serviços
  sudo service cbi_startup start    # inicia todos os serviços
  sudo reboot                       # reinicia somente o equipamento que esta logado
  sudo .driver_analytics/ask_for_reboot # caso haja conexao entre as cameras externa e interna, reinicia as duas juntas

Logs em tempo real:
  tail -f -n 50 .driver_analytics/logs/current/tagger.log
  tail -f -n 50 .driver_analytics/logs/current/camera.log
  cat .driveranalytics/logs/current/gps.log

Baixar logs:
  zip -r logs_ext.zip ~/.driver_analytics/logs/

GPS - checar:
  cat /dev/serial0
  cat /dev/serial0 | grep -ia gsa

GPS - resetar módulo:
  sudo echo "18" > /sys/class/gpio/export
  sudo echo "out" > /sys/class/gpio/gpio18/direction
  sudo echo "1" > /sys/class/gpio/gpio18/value
  sleep 2
  sudo echo "0" > /sys/class/gpio/gpio18/value

Disco e armazenamento:
  df -h
  du -sh [path]/*
  find /home/pi/.driver_analytics/logs/*/*recorder* -size +50M -delete
  find .driver_analytics/logs/current/camera_ip* -size +5M | sudo xargs truncate -s 5M

Foto da câmera:
  sudo service cbi_startup stop && sudo raspistill -o teste.jpg
  ./.driver_analytics/bin/camera -m 0 -b 1

RFID:
  cat .driver_analytics/logs/current/rfid.log
  grep -ia "id_code" .driver_analytics/logs/current/tagger.log

Uptime:
  uptime (se o equipamento estiver ligado em um dia, mas esta mostrando outro, há algo errado no sistema, verifique primeiro se a pasta .driver_analytics não está zerada, e entao se a pasta .driver_analytics/bin/ não está zerada

## ATUALIZAÇÃO DE FIRMWARE
Verificar versão no equipamento atualmente:
  sqlite3 .driver_analytics/database/driveranalytics.db 'select * from vehicle_config'

Linux (no equipamento):
  wget https://driveranalytics.com.br/api/updates/rpi3b/[VERSAO]/update.zip --no-check-certificate   # encontre no portal, na aba de versionamento qual foi a última versão lançada
  sudo unzip -oq update.zip -d /home/pi/.update_unzip/
  sudo rsync -rcv --exclude='upd_*.sh' /home/pi/.update_unzip/ /home/pi/.driver_analytics/
  sudo rsync -rcv --exclude='upd_*.sh' /home/pi/.update_unzip/ pi@10.0.90.196:/home/pi/.driver_analytics/

Windows (CMD):
  curl --insecure -o update.zip https://driveranalytics.com.br/api/updates/rpi3b/[VERSAO]/update.zip

Enviar update para equipamento via SCP:
  scp update.zip pi@10.0.89.195:/home/pi/.driver_analytics/

Atualizar versão no banco:
  sqlite3 /home/pi/.driver_analytics/database/driveranalytics.db 'UPDATE vehicle_config SET actual_version = [VERSAO]'

## PROBLEMAS DE INTERNET E CONEXÃO NA CÂMERA INTERNA
Verificar se o nome de rede que a interna busca e que a externa roteia é igual:
  NA EXTERNA:
    cat /etc/hostapd/hostapd.conf # nome da rede deve ser "DriverAnalytics-[placa]"
    sudo service hostapd status # se estiver tudo ok com o modem, deve aparecer 'active' em verde
  NA INTERNA:
    cat /etc/wpa_supplicant/wpa_supplicant.conf # lê se está igual, pode ser editado com o nano: nano /etc/wpa_supplicant/wpa_supplicant.conf
    dar reboot na interna após alteração

Sempre verificar se as duas câmeras estão com a mesma versão.

Verificar IP forwarding:
  sudo sysctl -w net.ipv4.ip_forward=1

Configurar iptables:
  sudo iptables -t nat -A POSTROUTING -o ppp0 -j MASQUERADE
  sudo iptables -A FORWARD -i wlan0 -o ppp0 -j ACCEPT
  sudo iptables -A FORWARD -i ppp0 -o eth0 -m state --state RELATED,ESTABLISHED -j ACCEPT

Trocar versão do iptables (se necessário):
  sudo update-alternatives --config iptables

## REDE E WIFI
Reiniciar wifi:
  sudo ifconfig wlan0 down && sudo ifconfig wlan0 up

Reinstalar driver wifi:
  sudo apt install firmware-realtek

Config DHCP:
  sudo nano /etc/dhcpcd.conf

## MODEM LTE
Verificar config:
  cat /etc/wvdial.conf

Discar manualmente:
  sudo service internet_monitor stop
  sudo minicom -D /dev/ttyLTE
  # Comandos AT: AT → AT+cmee=2 → AT+cpin?
  sudo wvdial vivo

## SAMBA / MOUNT
Erro "/home/pi/.mount/remote/ IS NOT A MOUNT POINT":
  Checar /etc/dhcpcd.conf (pode estar vazio)
  Checar serviço samba em ambas as câmeras

Criar diretórios samba:
  sudo mkdir -p /var/log/samba/cores
  sudo mkdir -p /var/lib/samba/private/msg.sock

Erro ELF inválido:
  sudo apt-get install --reinstall libkeyutils1
  sudo apt-get install --reinstall samba-libs

## SERVIÇO CBI_STARTUP NÃO INICIA
  cd /etc/init.d/
  sudo update-rc.d cbi_startup defaults
  sudo update-rc.d cbi_startup enable
  sudo service cbi_startup start

## FRP NÃO INICIA
Checar /etc/resolv.conf (deve ter nameserver 8.8.8.8)
  lsattr /etc/ppp/resolv.conf
  sudo chattr +i /etc/ppp/resolv.conf

## TMUX
  tmux new -s nome       # criar sessão
  tmux attach -t nome    # voltar para sessão
  Ctrl+b depois d        # detach
  tmux ls                # listar sessões
  tmux kill-session -t nome

## HORÁRIO
  sudo systemctl start systemd-timesyncd

## CONFIGURAÇÕES DE MODO
  nano .driver_analytics/mode #as configurações especificas de modo estão em um arquivo compartilhado`;

// --- Initial Data Seed ---
const userExists = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
if (!userExists) {
  db.prepare('INSERT INTO users (username, password, is_admin) VALUES (?,?,1)')
    .run('admin', bcrypt.hashSync('admin123', 10));
  console.log('✅ Default admin created: admin / admin123');
}

const kbExists = db.prepare('SELECT id FROM knowledge WHERE id = 1').get();
if (!kbExists) {
  db.prepare('INSERT INTO knowledge (id, content) VALUES (1, ?)').run(INITIAL_KB_CONTENT);
}

// --- Middlewares ---
app.use(express.json({ limit: '5mb' }));

interface RequestWithUser extends express.Request {
  user?: any;
}

const authMiddleware = (req: RequestWithUser, res: express.Response, next: express.NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token required' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const adminMiddleware = (req: RequestWithUser, res: express.Response, next: express.NextFunction) => {
  authMiddleware(req, res, () => {
    if (!req.user?.is_admin) return res.status(403).json({ error: 'Admin access required' });
    next();
  });
};

// --- API Routes ---

// Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'All fields required' });
  
  const user: any = db.prepare('SELECT * FROM users WHERE username = ?').get(username.toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }
  
  const token = jwt.sign(
    { id: user.id, username: user.username, is_admin: user.is_admin === 1 },
    JWT_SECRET,
    { expiresIn: '12h' }
  );
  
  res.json({ token, id: user.id, username: user.username, is_admin: user.is_admin === 1 });
});

// Me
app.get('/api/me', authMiddleware, (req: RequestWithUser, res) => {
  res.json({ id: req.user.id, username: req.user.username, is_admin: req.user.is_admin });
});

// Chat History Logging
app.post('/api/chat/log', authMiddleware, (req: RequestWithUser, res) => {
  const { user_message, bot_message } = req.body;
  if (!user_message || !bot_message) return res.status(400).json({ error: 'Missing content' });
  
  db.prepare('INSERT INTO chat_logs (username, user_message, bot_message) VALUES (?,?,?)')
    .run(req.user.username, user_message, bot_message);
    
  res.json({ success: true });
});

// Knowledge Base for AI
app.get('/api/chat/kb', authMiddleware, (req: RequestWithUser, res) => {
  const kb: any = db.prepare('SELECT content FROM knowledge WHERE id = 1').get();
  res.json({ content: kb?.content || '' });
});

// Admin: Knowledge
app.get('/api/knowledge', adminMiddleware, (req, res) => {
  const kb = db.prepare('SELECT * FROM knowledge WHERE id = 1').get();
  res.json(kb);
});

app.put('/api/knowledge', adminMiddleware, (req: RequestWithUser, res) => {
  try {
    const { content } = req.body;
    if (content === undefined || content === null) {
      return res.status(400).json({ error: 'Missing content in request body' });
    }
    
    // Upsert logic: try update, if no changes, insert
    const update = db.prepare("UPDATE knowledge SET content = ?, updated_at = datetime('now'), updated_by = ? WHERE id = 1")
      .run(content, req.user.username);
    
    if (update.changes === 0) {
      db.prepare('INSERT INTO knowledge (id, content, updated_by) VALUES (1, ?, ?)')
        .run(content, req.user.username);
    }
    
    console.log(`✅ Knowledge Base updated by ${req.user.username}`);
    res.json({ success: true });
  } catch (err: any) {
    console.error('❌ Error updating KB:', err);
    res.status(500).json({ error: 'Internal server error while saving KB: ' + err.message });
  }
});

// Admin: Users
app.get('/api/users', adminMiddleware, (req, res) => {
  const users = db.prepare('SELECT id, username, is_admin, created_at FROM users ORDER BY created_at DESC').all();
  res.json(users);
});

app.post('/api/users', adminMiddleware, (req, res) => {
  const { username, password, is_admin } = req.body;
  try {
    db.prepare('INSERT INTO users (username, password, is_admin) VALUES (?,?,?)')
      .run(username.toLowerCase().trim(), bcrypt.hashSync(password, 10), is_admin ? 1 : 0);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: 'User already exists or invalid data' });
  }
});

app.delete('/api/users/:id', adminMiddleware, (req: RequestWithUser, res) => {
  const id = parseInt(req.params.id);
  if (id === req.user.id) return res.status(400).json({ error: 'Cannot delete self' });
  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  res.json({ success: true });
});

// Admin: Logs
app.get('/api/logs', adminMiddleware, (req, res) => {
  const logs = db.prepare('SELECT * FROM chat_logs ORDER BY created_at DESC LIMIT 200').all();
  res.json(logs);
});

// --- Vite Integration ---
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Motora AI Bot running at http://localhost:${PORT}`);
  });
}

start();
