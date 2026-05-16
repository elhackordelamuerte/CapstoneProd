# Guide de Configuration : Télécommande ESP32 MeetingPi

Ce guide vous explique comment configurer et utiliser votre écran tactile **ESP32-2432S028R** pour contrôler l'enregistrement de MeetingPi, que ce soit en mode WiFi ou via une connexion filaire USB (fallback).

## 1. Prérequis Matériels

*   Un écran **ESP32-2432S028R** (Cheap Yellow Display).
*   Un câble USB Micro (pour l'alimentation et la connexion filaire au Raspberry Pi).
*   Un Raspberry Pi avec **MeetingPi** installé et fonctionnel.

---

## 2. Configuration de l'ESP32

### Installation des Bibliothèques (Arduino IDE)
Ouvrez l'IDE Arduino et installez les bibliothèques suivantes via le Gestionnaire de Bibliothèques :
1.  **lvgl** (Version 9.x recommandée)
2.  **TFT_eSPI**
3.  **XPT2046_Touchscreen**
4.  **ArduinoJson**

### Configuration du code
1.  Allez dans le dossier `esp32-remote`.
2.  Ouvrez le fichier `config.h` et modifiez les valeurs suivantes :
    *   `WIFI_SSID` : Le nom de votre réseau WiFi (doit être en 2.4 GHz).
    *   `WIFI_PASS` : Votre mot de passe WiFi.
    *   `API_BASE_URL` : L'adresse IP de votre Raspberry Pi (ex: `http://192.168.1.50:8000`).

### Flashage
1.  Connectez l'ESP32 à votre ordinateur.
2.  Dans l'IDE Arduino, sélectionnez la carte **ESP32 Dev Module**.
3.  Cliquez sur **Téléverser**.

---

## 3. Configuration du Raspberry Pi (Mode USB)

Si vous souhaitez utiliser le mode filaire (indispensable si votre WiFi n'est pas en 2.4 GHz), vous devez configurer le script "pont".

### Installation des dépendances
Connectez-vous en SSH à votre Raspberry Pi et exécutez :
```bash
source /home/cmoi/meetingpi/.venv/bin/activate
pip install pyserial requests
```

### Installation du Service
Pour que la connexion USB fonctionne automatiquement au démarrage du Pi :
```bash
# Copier le fichier de service
sudo cp /home/cmoi/meetingpi/pi-backend/systemd/meetingpi-bridge.service /etc/systemd/system/

# Recharger systemd et activer le service
sudo systemctl daemon-reload
sudo systemctl enable meetingpi-bridge
sudo systemctl start meetingpi-bridge
```

---

## 4. Redémarrage de l'API

Pour que les nouveaux points d'accès (comme `/toggle`) soient actifs sur votre Raspberry Pi, vous devez redémarrer le service API :

```bash
sudo systemctl restart meetingpi-api
```

Si vous avez déjà configuré le mode USB, vous pouvez redémarrer les deux services en une fois :
```bash
sudo systemctl restart meetingpi-api meetingpi-bridge
```

---

## 5. Utilisation

### Mode WiFi
Au démarrage, l'écran tente de se connecter au WiFi pendant 10 secondes.
*   Si réussi : L'indicateur en haut à droite affiche **WIFI** (Bleu).
*   Toutes les commandes passent par le réseau local.

### Mode USB (Filaire)
Si le WiFi échoue ou n'est pas configuré :
*   L'écran affiche **USB Mode Active** et l'indicateur affiche **USB** (Gris).
*   Branchez simplement l'ESP32 sur l'un des ports USB du Raspberry Pi.
*   Les commandes passent instantanément par le câble USB.

### Contrôles
*   **Bouton START** : Lance un nouvel enregistrement.
*   **Bouton STOP** : Arrête l'enregistrement en cours et lance la transcription/résumé.
*   **Chronomètre** : Affiche la durée de l'enregistrement en temps réel.
