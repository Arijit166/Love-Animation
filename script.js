window.requestAnimationFrame =
window.requestAnimationFrame ||
(function () {
  return function (callback, element) {
    var lastTime = element.__lastTime || 0;
    var currTime = Date.now();
    var timeToCall = Math.max(1, 33 - (currTime - lastTime));
    window.setTimeout(callback, timeToCall);
    element.__lastTime = currTime + timeToCall;
  };
})();
window.isDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
(navigator.userAgent || navigator.vendor || window.opera).toLowerCase()
);
var loaded = false;
var init = function () {
if (loaded) return;
loaded = true;
var mobile = window.isDevice;
var koef = mobile ? 0.5 : 1;
var canvas = document.getElementById("heart");
var ctx = canvas.getContext("2d");
var rand = Math.random;
var baseWidth = 1920;
var baseHeight = 1080;
var updateCanvasSize = function () {
  var width = (canvas.width = koef * innerWidth);
  var height = (canvas.height = koef * innerHeight);
  var scale = Math.min(width / baseWidth, height / baseHeight);
  ctx.fillStyle = "rgba(0,0,0,1)";
  ctx.fillRect(0, 0, width, height);
  return { width, height, scale };
};
var { width, height, scale } = updateCanvasSize();
var drawText = function (opacity) {
  ctx.font = `${100 * scale}px Arial`;
  ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
  ctx.textAlign = "center";
  ctx.fillText("I love you", width / 2, height / 2); 
};
var heartPosition = function (rad) {
  return [
    Math.pow(Math.sin(rad), 3),
    -(
      15 * Math.cos(rad) -
      5 * Math.cos(2 * rad) -
      2 * Math.cos(3 * rad) -
      Math.cos(4 * rad)
    ),
  ];
};
var scaleAndTranslate = function (pos, sx, sy, dx, dy) {
  return [dx + pos[0] * sx, dy + pos[1] * sy];
};
var updatePointsOrigin = function () {
  var pointsOrigin = [];
  var dr = mobile ? 0.3 : 0.1;
  for (var i = 0; i < Math.PI * 2; i += dr)
    pointsOrigin.push(scaleAndTranslate(heartPosition(i), 372 * scale, 23 * scale, 0, 0)); // 310 -> 372, 19 -> 23
  for (var i = 0; i < Math.PI * 2; i += dr)
    pointsOrigin.push(scaleAndTranslate(heartPosition(i), 300 * scale, 18 * scale, 0, 0)); // 250 -> 300, 15 -> 18
  for (var i = 0; i < Math.PI * 2; i += dr)
    pointsOrigin.push(scaleAndTranslate(heartPosition(i), 228 * scale, 13 * scale, 0, 0)); // 190 -> 228, 11 -> 13
  return pointsOrigin;
};
var pointsOrigin = updatePointsOrigin();
var heartPointsCount = pointsOrigin.length;
var targetPoints = [];
var pulse = function (kx, ky) {
  for (var i = 0; i < pointsOrigin.length; i++) {
    targetPoints[i] = [
      kx * pointsOrigin[i][0] + width / 2,
      ky * pointsOrigin[i][1] + height / 2.2,
    ];
  }
};
window.addEventListener("resize", function () {
  var size = updateCanvasSize();
  width = size.width;
  height = size.height;
  scale = size.scale;
  pointsOrigin = updatePointsOrigin();
  heartPointsCount = pointsOrigin.length;
});
var traceCount = mobile ? 20 : 50;
var e = [];
for (var i = 0; i < heartPointsCount; i++) {
  var x = rand() * width;
  var y = rand() * height;
  e[i] = {
    vx: 0,
    vy: 0,
    R: 2 * scale,
    speed: (rand() + 5) * scale,
    q: ~~(rand() * heartPointsCount),
    D: 2 * (i % 2) - 1,
    force: 0.2 * rand() + 0.7,
    trace: Array.from({ length: traceCount }, () => ({ x, y })),
  };
}
var glowingHearts = [];
var createGlowingHeart = function () {
  return {
    x: rand() * width,
    y: height + 20 * scale,
    vy: -(rand() * 4 + 2) * scale,
    size: (rand() * 15 + 10) * scale,
    opacity: 1,
    color: interpolateColor(rand()),
  };
};
var config = { traceK: 0.4, timeDelta: 0.6 };
var time = 0;
var colorTime = 0;
var colorDuration = 2;
var textOpacity = 0;
var showText = false;
var heartsPassed = 0;
var interpolateColor = function (t) {
  var startColor = { r: 255, g: 105, b: 190 };
  var endColor = { r: 255, g: 0, b: 0 };
  var r, g, b;
  if (t < 0.5) {
    r = Math.round(startColor.r + (endColor.r - startColor.r) * (t * 2));
    g = Math.round(startColor.g + (endColor.g - startColor.g) * (t * 2));
    b = Math.round(startColor.b + (endColor.b - startColor.b) * (t * 2));
  } else {
    t = (t - 0.5) * 2;
    r = Math.round(endColor.r + (startColor.r - endColor.r) * t);
    g = Math.round(endColor.g + (endColor.g - startColor.g) * t);
    b = Math.round(startColor.b + (endColor.b - startColor.b) * t);
  }
  return `rgba(${r}, ${g}, ${b}, `;
};
var loop = function () {
  var n = -Math.cos(time);
  pulse((1 + n) * 0.5, (1 + n) * 0.5);
  time += (Math.sin(time) < 0 ? 9 : n > 0.8 ? 0.2 : 1) * config.timeDelta;
  ctx.fillStyle = "rgba(0,0,0,.1)";
  ctx.fillRect(0, 0, width, height);
  colorTime += 0.016;
  var t = (colorTime % colorDuration) / colorDuration;
  var currentColor = interpolateColor(t);
  for (var i = e.length; i--; ) {
    var u = e[i];
    var q = targetPoints[u.q];
    var dx = u.trace[0].x - q[0];
    var dy = u.trace[0].y - q[1];
    var length = Math.sqrt(dx * dx + dy * dy);
    if (length < 10 * scale) {
      if (rand() > 0.95) {
        u.q = ~~(rand() * heartPointsCount);
      } else {
        if (rand() > 0.99) u.D *= -1;
        u.q = (u.q + u.D) % heartPointsCount;
        if (u.q < 0) u.q += heartPointsCount;
      }
    }
    u.vx += (-dx / length) * u.speed;
    u.vy += (-dy / length) * u.speed;
    u.trace[0].x += u.vx;
    u.trace[0].y += u.vy;
    u.vx *= u.force;
    u.vy *= u.force;
    for (var k = 0; k < u.trace.length - 1; k++) {
      var T = u.trace[k];
      var N = u.trace[k + 1];
      N.x -= config.traceK * (N.x - T.x);
      N.y -= config.traceK * (N.y - T.y);
    }
    ctx.fillStyle = currentColor + "0.7)";
    u.trace.forEach((t) => ctx.fillRect(t.x, t.y, 2 * scale, 2 * scale));
  }
  if (rand() > 0.7) glowingHearts.push(createGlowingHeart());
  for (var i = glowingHearts.length - 1; i >= 0; i--) {
    var h = glowingHearts[i];
    h.y += h.vy;
    h.opacity -= 0.01;
    var gradient = ctx.createRadialGradient(h.x, h.y, 0, h.x, h.y, h.size);
    gradient.addColorStop(0, h.color + h.opacity + ")");
    gradient.addColorStop(1, h.color + "0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    for (var rad = 0; rad < Math.PI * 2; rad += 0.1) {
      var [hx, hy] = heartPosition(rad);
      var [x, y] = scaleAndTranslate([hx, hy], h.size / 2, h.size / 2, h.x, h.y);
      if (rad === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    if (h.y < -h.size) {
      heartsPassed++;
      if (heartsPassed >= 5) showText = true;
      glowingHearts.splice(i, 1);
    } else if (h.opacity <= 0) {
      glowingHearts.splice(i, 1);
    }
  }
  if (showText) {
    textOpacity = Math.min(textOpacity + 0.05, 1);
    drawText(textOpacity);
  }
  window.requestAnimationFrame(loop, canvas);
};
loop();
};
var s = document.readyState;
if (s === "complete" || s === "loaded" || s === "interactive") init();
else document.addEventListener("DOMContentLoaded", init);