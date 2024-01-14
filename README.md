# Smart Urban Gardening Assistent
SUGA ist eine innovative Lösung für PflanzenliebhaberInnen und FreizeitgärtnerInnen, um die Gesundheit ihrer Pflanzen in städtischen Umgebungen zu optimieren. Anwender können ihre Pflanzen in der Webanwendung entweder über Desktop oder Smartphone hinzufügen und Sensoren messen kontinuierlich Umweltbedingungen wie Temperatur, Luftfeuchtigkeit und Lichtstärke. Infolgedessen werden passende Statusmeldungen und Empfehlungen angezeigt, um sicherzustellen, dass jede Pflanze in idealen Voraussetzungen wächst
## Embedded System 
Mikrocontroller (Arduino) und Sensoren (DHT11, BH1750 und ESP8266), um die Umweltbedingungen mit C++ zu erfassen und über HTTP (Hypertext Transfer Protocol) an die Webanwendung zu senden.
## Webanwendung
Benutzer- und Pflanzeninformationen werden in einer relationalen Datenbank (mySQL) verwaltet. Implementierung des Frontends mittels HTML (Hypertext Markup Language), CSS (Cascading Style Sheets, inklusive Tailwind CSS), JavaScript (unter Verwendung von Node, Vue, Nuxt und weiteren kleinen Frameworks, Komponenten und Bibliotheken, welche im Laufe der Entwicklung hinzukommen).
