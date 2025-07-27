import asyncio
import websockets
import json

# -- HEADERS pour connexion à EVO GAMES (adaptés depuis ta capture) --
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
    "Cookie": "cdn=https://static.ecdn.com; lang=fr; locale=fr; EVOSESSIONID=qh46kdxyaneda5ajtbdhsbdgbbcbp4wwb64821a1b46aac4bc41a59b71fbb8f9d9b270376e7bb7b70",
    "Origin": "https://lucky8eu.evo-games.com",
    "Host": "lucky8eu.evo-games.com",
    "Sec-WebSocket-Extensions": "permessage-deflate; client_max_window_bits",
}

clients = set()

async def ws_handler(websocket, path):
    clients.add(websocket)
    try:
        await websocket.wait_closed()
    finally:
        clients.remove(websocket)

async def broadcast(message):
    if clients:
        await asyncio.gather(*(ws.send(message) for ws in clients))

async def listen_roulette():
    # ⚠️ Remplace l’URL par la tienne, et adapte EVOSESSIONID au besoin
    url = "wss://lucky8eu.evo-games.com/public/roulette/player/game/lkcbrbdckjxajdol/socket?messageFormat=json&EVOSESSIONID=qh46kxdyaneda5ajtbdpwix4acjtbohndd25dace066264e3ff3211ded692fb959ff33d3b4bf81ecb&client_version=6.20250726.113609.53701-25113a9ddc&instance=1ttekv-qh46kxdyaneda5aj-lkcbrbdckjxajdol"
    import websockets as wsclient
    print("🔌 Connexion à la roulette...")
    async with wsclient.connect(url, extra_headers=headers) as ws:
        print("✅ Connecté. En attente des tirages...\n")
        while True:
            try:
                message = await ws.recv()
                data = json.loads(message)
                if data.get("type") == "roulette.winSpots":
                    args = data.get("args", {})
                    code = args.get("code")
                    description = args.get("description")
                    print(f"🎯 Résultat : {code} ({description})")
                    await broadcast(json.dumps({"result": code, "desc": description}))
            except Exception as e:
                print("❌ Erreur :", e)
                break

async def main():
    # Serveur WebSocket local (pour React) sur ws://localhost:8765
    server = await websockets.serve(ws_handler, "localhost", 8765)
    await listen_roulette()

if __name__ == "__main__":
    asyncio.run(main())
