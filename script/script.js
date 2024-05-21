let autofillEnabled = false;
document
  .getElementById("toggleOrientation")
  .addEventListener("click", function () {
    autofillEnabled = !autofillEnabled;
    this.textContent = autofillEnabled
      ? "Вимкнути автооновлення кута"
      : "Увімкнути автооновлення кута";
  });

document
  .getElementById("inputForm")
  .addEventListener("submit", function (event) {
    event.preventDefault(); // Prevent form submission
    // Отримання значень параметрів
    let mass = parseFloat(document.getElementById("mass").value);
    let initialVelocity = parseFloat(
      document.getElementById("initialVelocity").value
    );
    let dragCoefficient = parseFloat(
      document.getElementById("dragCoefficient").value
    );
    let angle = parseFloat(document.getElementById("angle").value);
    let azimuth = parseFloat(document.getElementById("azimuth").value);
    let initialZ = parseFloat(document.getElementById("initialZ").value);
    let gravity = parseFloat(document.getElementById("gravity").value);
    let airDensity = parseFloat(document.getElementById("airDensity").value);
    let projectileArea = parseFloat(
      document.getElementById("projectileArea").value
    );

    // Отримання координат і конвертація в десятковий формат
    let latitude = convertToDecimal(
      parseFloat(document.getElementById("latitudeDegrees").value),
      parseFloat(document.getElementById("latitudeMinutes").value),
      parseFloat(document.getElementById("latitudeSeconds").value),
      document.getElementById("latitudeDirection").value
    );
    let longitude = convertToDecimal(
      parseFloat(document.getElementById("longitudeDegrees").value),
      parseFloat(document.getElementById("longitudeMinutes").value),
      parseFloat(document.getElementById("longitudeSeconds").value),
      document.getElementById("longitudeDirection").value
    );

    // Виклик функції для розрахунку траєкторії
    calculateTrajectory(
      mass,
      initialVelocity,
      dragCoefficient,
      angle,
      azimuth,
      initialZ,
      latitude,
      longitude,
      gravity,
      airDensity,
      projectileArea
    );
  });

function success(position) {
  const lat = position.coords.latitude;
  const lon = position.coords.longitude;

  const latDegrees = Math.floor(Math.abs(lat));
  const latMinutes = Math.floor((Math.abs(lat) - latDegrees) * 60);
  const latSeconds = Math.round(
    ((Math.abs(lat) - latDegrees) * 60 - latMinutes) * 60
  );
  const latDirection = lat >= 0 ? "N" : "S";

  const lonDegrees = Math.floor(Math.abs(lon));
  const lonMinutes = Math.floor((Math.abs(lon) - lonDegrees) * 60);
  const lonSeconds = Math.round(
    ((Math.abs(lon) - lonDegrees) * 60 - lonMinutes) * 60
  );
  const lonDirection = lon >= 0 ? "E" : "W";

  document.getElementById("latitudeDegrees").value = latDegrees;
  document.getElementById("latitudeMinutes").value = latMinutes;
  document.getElementById("latitudeSeconds").value = latSeconds;
  document.getElementById("latitudeDirection").value = latDirection;

  document.getElementById("longitudeDegrees").value = lonDegrees;
  document.getElementById("longitudeMinutes").value = lonMinutes;
  document.getElementById("longitudeSeconds").value = lonSeconds;
  document.getElementById("longitudeDirection").value = lonDirection;
}

function error() {
  alert("Неможливо отримати ваше місцезнаходження.");
}

const options = {
  enableHighAccuracy: true,
  timeout: 5000,
  maximumAge: 0,
};

document
  .getElementById("autofillButton")
  .addEventListener("click", function () {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(success, error, options);
    } else {
      alert("Ваш браузер не підтримує геолокацію.");
    }
  });

window.addEventListener("deviceorientation", function (event) {
  if (autofillEnabled) {
    window.ondeviceorientationabsolute = function (event) {
      if (autofillEnabled) {
        let beta = event.beta;
        let alpha = event.alpha;
        const adjustedAngle = beta >= -90 && beta <= 90 ? Math.abs(beta) : 0;
        let adjustedAzimuth = (360 - alpha) % 360;
        document.getElementById("angle").value = adjustedAngle.toFixed(1);
        document.getElementById("azimuth").value = adjustedAzimuth.toFixed(1);
      }
    };
  }
});

function convertToDecimal(degrees, minutes, seconds, direction) {
  let decimal = degrees + minutes / 60 + seconds / 3600;
  if (direction === "S" || direction === "W") {
    decimal = -decimal;
  }
  return decimal;
}

function calculateTrajectory(
  mass,
  initialVelocity,
  dragCoefficient,
  angle,
  azimuth,
  initialZ,
  latitude,
  longitude,
  gravity,
  airDensity,
  projectileArea
) {
  // Переведення кутів з градусів в радіани
  const angleRadians = angle * (Math.PI / 180);
  const azimuthRadians = azimuth * (Math.PI / 180);

  // Горизонтальна та вертикальна складові початкової швидкості (м/с)
  let vX = initialVelocity * Math.cos(angleRadians);
  let vY = initialVelocity * Math.sin(angleRadians);

  // Ініціалізація положення
  let x = 0;
  let y = initialZ;
  let t = 0;
  const deltaT = 0.01; // Крок часу для інтеграції

  while (y > 0) {
    t += deltaT;

    // Визначення сили опору повітря
    const speed = Math.sqrt(vX * vX + vY * vY);
    const dragForce =
      0.5 * airDensity * speed * speed * dragCoefficient * projectileArea;

    // Розрахунок прискорень
    const aX = (-dragForce * (vX / speed)) / mass;
    const aY = -gravity - (dragForce * (vY / speed)) / mass;

    // Оновлення швидкості
    vX += aX * deltaT;
    vY += aY * deltaT;

    // Оновлення положення
    x += vX * deltaT;
    y += vY * deltaT;
  }

  // Розрахунок зміщення по азимуту
  const shiftX = x * Math.cos((90 - azimuth) * (Math.PI / 180));
  const shiftY = x * Math.sin((90 - azimuth) * (Math.PI / 180));

  // Координати приземлення
  const landingLatitude = latitude + shiftY / 111000; // Переводимо горизонтальне зміщення з метрів у градуси (приблизно)
  const landingLongitude =
    longitude + shiftX / (111000 * Math.cos(latitude * (Math.PI / 180))); // Переводимо горизонтальне зміщення з метрів у градуси (приблизно)

  // Виведення результатів
  // console.log("Час польоту:", t.toFixed(2), "с");
  // console.log("Горизонтальна відстань:", x.toFixed(2), "м");
  // console.log("Азимут:", azimuth.toFixed(2), "градуси");
  // console.log(
  //   "Координати приземлення (широта, довгота):",
  //   landingLatitude.toFixed(6),
  //   landingLongitude.toFixed(6)
  // );
  document.getElementById("result").innerHTML = `
              <p>Час польоту: ${t.toFixed(2)} с</p>
              <p>Горизонтальна відстань: ${x.toFixed(2)} м</p>
              <p>Азимут: ${azimuth.toFixed(2)} градуси</p>
              <p>Координати приземлення (широта, довгота): ${landingLatitude.toFixed(
                6
              )}, ${landingLongitude.toFixed(6)}</p>
            `;

  // Відображення карти з геолокаційними точками
  displayMap(latitude, longitude, landingLatitude, landingLongitude);
}

let map; // Глобальна змінна для зберігання посилання на карту

function displayMap(startLat, startLng, endLat, endLng) {
  if (!map) {
    map = L.map("map").setView([startLat, startLng], 8);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
  } else {
    map.setView([startLat, startLng], 8);
    map.eachLayer(function (layer) {
      if (layer instanceof L.Marker || layer instanceof L.Polyline) {
        map.removeLayer(layer);
      }
    });
  }

  const startMarker = L.marker([startLat, startLng])
    .addTo(map)
    .bindPopup("Точка відльоту")
    .openPopup();

  const endMarker = L.marker([endLat, endLng])
    .addTo(map)
    .bindPopup("Точка прильоту")
    .openPopup();

  const latlngs = [
    [startLat, startLng],
    [endLat, endLng],
  ];

  const polyline = L.polyline(latlngs, { color: "red" }).addTo(map);
  map.fitBounds(polyline.getBounds());
}

document.querySelector(".button-div").addEventListener("click", function () {
  toggleElements();
});

document.querySelector(".open-menu").addEventListener("click", function () {
  toggleElements();
});

function toggleElements() {
  const elements = [
    document.querySelector(".open-menu"),
    document.querySelector(".avto-corection"),
    document.querySelector(".corection"),
    document.querySelector(".conteiner"),
  ];

  elements.forEach((el) => el.classList.toggle("none"));
}

let trigger = false;
let intervalId; // оголошуємо змінну для зберігання ID інтервалу

document
  .querySelector(".avto-corection")
  .addEventListener("click", function () {
    if (trigger) {
      clearInterval(intervalId); // якщо trigger === true, зупиняємо інтервал
      trigger = false;
    } else {
      intervalId = setInterval(() => {
        let mass = parseFloat(document.getElementById("mass").value);
        let initialVelocity = parseFloat(
          document.getElementById("initialVelocity").value
        );
        let dragCoefficient = parseFloat(
          document.getElementById("dragCoefficient").value
        );
        let angle = parseFloat(document.getElementById("angle").value);
        let azimuth = parseFloat(document.getElementById("azimuth").value);
        let initialZ = parseFloat(document.getElementById("initialZ").value);
        let gravity = parseFloat(document.getElementById("gravity").value);
        let airDensity = parseFloat(
          document.getElementById("airDensity").value
        );
        let projectileArea = parseFloat(
          document.getElementById("projectileArea").value
        );

        // Отримання координат і конвертація в десятковий формат
        let latitude = convertToDecimal(
          parseFloat(document.getElementById("latitudeDegrees").value),
          parseFloat(document.getElementById("latitudeMinutes").value),
          parseFloat(document.getElementById("latitudeSeconds").value),
          document.getElementById("latitudeDirection").value
        );
        let longitude = convertToDecimal(
          parseFloat(document.getElementById("longitudeDegrees").value),
          parseFloat(document.getElementById("longitudeMinutes").value),
          parseFloat(document.getElementById("longitudeSeconds").value),
          document.getElementById("longitudeDirection").value
        );

        // Виклик функції для розрахунку траєкторії
        calculateTrajectory(
          mass,
          initialVelocity,
          dragCoefficient,
          angle,
          azimuth,
          initialZ,
          latitude,
          longitude,
          gravity,
          airDensity,
          projectileArea
        );
      }, 500);
      trigger = true;
    }
  });

document
  .querySelector(".corection")
  .addEventListener("click", function (event) {
    event.preventDefault(); // Prevent form submission
    // Отримання значень параметрів
    let mass = parseFloat(document.getElementById("mass").value);
    let initialVelocity = parseFloat(
      document.getElementById("initialVelocity").value
    );
    let dragCoefficient = parseFloat(
      document.getElementById("dragCoefficient").value
    );
    let angle = parseFloat(document.getElementById("angle").value);
    let azimuth = parseFloat(document.getElementById("azimuth").value);
    let initialZ = parseFloat(document.getElementById("initialZ").value);
    let gravity = parseFloat(document.getElementById("gravity").value);
    let airDensity = parseFloat(document.getElementById("airDensity").value);
    let projectileArea = parseFloat(
      document.getElementById("projectileArea").value
    );

    // Отримання координат і конвертація в десятковий формат
    let latitude = convertToDecimal(
      parseFloat(document.getElementById("latitudeDegrees").value),
      parseFloat(document.getElementById("latitudeMinutes").value),
      parseFloat(document.getElementById("latitudeSeconds").value),
      document.getElementById("latitudeDirection").value
    );
    let longitude = convertToDecimal(
      parseFloat(document.getElementById("longitudeDegrees").value),
      parseFloat(document.getElementById("longitudeMinutes").value),
      parseFloat(document.getElementById("longitudeSeconds").value),
      document.getElementById("longitudeDirection").value
    );

    // Виклик функції для розрахунку траєкторії
    calculateTrajectory(
      mass,
      initialVelocity,
      dragCoefficient,
      angle,
      azimuth,
      initialZ,
      latitude,
      longitude,
      gravity,
      airDensity,
      projectileArea
    );
  });
