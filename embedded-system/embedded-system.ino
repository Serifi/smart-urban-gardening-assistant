#include "WiFiEsp.h"
#include <Wire.h>
#include <BH1750.h>
#include <DHT.h>

#define DHT_PIN 3       // Pin des DHT11
#define DHT_TYPE DHT11  // DHT11

char ssid[] = "***";             // Netzwerk SSID (Name)
char pass[] = "***";             // Netzwerkkennwort
int status = WL_IDLE_STATUS;     // Status des Wifi-Radios
int port = 80;                   // Port für den Webserver

BH1750 lightMeter;
DHT dht(DHT_PIN, DHT_TYPE);
WiFiEspServer server(port);

void setup() {
  Serial.begin(115200);   // Serial 0 für Debugging
  Serial2.begin(115200);  // Serial 2 für ESP-Modul

  Wire.begin();
  lightMeter.begin();
  dht.begin();

  WiFi.init(&Serial2);                          // ESP-Modul
  if (WiFi.status() == WL_NO_SHIELD) {          // Shield vorhanden?
    Serial.println("WiFi shield not present");  // Stopp, wenn nicht vorhanden
    while (true);
  }
  while (status != WL_CONNECTED) {
    Serial.print("Attempting to connect to WPA SSID: ");
    Serial.println(ssid);
    status = WiFi.begin(ssid, pass);  // Verbindungsversuch mit Netzwerk
  }
  Serial.println("You're connected to the network");

  server.begin();  // Webserver

  Serial.println();
  printCurrentNet();
  Serial.println();
  printWifiData();
}

void loop() {
  WiFiEspClient client = server.available();  // Warte auf Verbindung zum Client

  if (client) {
    Serial.println("New client");
    processClient(client);
  }

  delay(10000);  // Reduktion der Sensorauslastung
}

void processClient(WiFiEspClient& client) {
  while (client.available()) {                                 // Warte auf Anfrage
    String request = client.readStringUntil('\r');             // Anfrage
    if (request.indexOf("GET") != -1) {                        // Anfrage ein GET?
      if (request.indexOf("/environmentalCondition") != -1) {  // Anfrage zu Umweltbedingungen?
        handleGETRequest(client);
      }
    }
  }
}

void handleGETRequest(WiFiEspClient& client) {
  float lichtstaerke = lightMeter.readLightLevel();
  float luftfeuchtigkeit = dht.readHumidity();
  float temperatur = dht.readTemperature();

  String environmentalCondition = "{ \"temperature\": " + String(temperatur) + ", \"humidity\": " + String(luftfeuchtigkeit) + ", \"lightIntensity\": " + String(lichtstaerke) + " }";

  client.println("HTTP/1.1 200 OK");
  client.println("Content-Type: application/json");
  client.print("Content-Length: ");
  client.println(environmentalCondition.length());
  client.println("Connection: close");
  client.println();
  client.println(environmentalCondition);
}

void printWifiData() {
  IPAddress ip = WiFi.localIP();
  Serial.print("IP Address: ");
  Serial.println(ip);

  byte mac[6];
  WiFi.macAddress(mac);
  char buf[20];
  sprintf(buf, "%02X:%02X:%02X:%02X:%02X:%02X", mac[5], mac[4], mac[3], mac[2], mac[1], mac[0]);
  Serial.print("MAC address: ");
  Serial.println(buf);
}

void printCurrentNet() {
  Serial.print("SSID: ");
  Serial.println(WiFi.SSID());

  byte bssid[6];
  WiFi.BSSID(bssid);
  char buf[20];
  sprintf(buf, "%02X:%02X:%02X:%02X:%02X:%02X", bssid[5], bssid[4], bssid[3], bssid[2], bssid[1], bssid[0]);
  Serial.print("BSSID: ");
  Serial.println(buf);

  long rssi = WiFi.RSSI();
  Serial.print("Signal strength (RSSI): ");
  Serial.println(rssi);
}