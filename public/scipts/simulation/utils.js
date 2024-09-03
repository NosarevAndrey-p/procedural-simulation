class Vector2D {
  /**
   * Create a new Vector2D instance.
   * @param {number} x - The x coordinate.
   * @param {number} y - The y coordinate.
   */
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  /**
   * Generate a random Vector2D with a magnitude in range from minMagnitude to maxMagnitude.
   * @param {number} [maxMagnitude=1] - The maximum magnitude of the vector.
   * @param {number} [minMagnitude=0] - The minimum magnitude of the vector.
   * @returns {Vector2D} A new Vector2D instance.
   */
  static random(maxMagnitude = 1, minMagnitude = 0) {
    const angle = Math.random() * 2 * Math.PI;
    const magnitude =
      minMagnitude + Math.random() * (maxMagnitude - minMagnitude);
    const x = magnitude * Math.cos(angle);
    const y = magnitude * Math.sin(angle);
    return new Vector2D(x, y);
  }

  /**
   * Create a Vector2D from polar coordinates.
   * @param {number} angle - The angle in radians.
   * @param {number} magnitude - The magnitude of the vector.
   * @returns {Vector2D} A new Vector2D instance.
   */
  static fromPolar(angle, magnitude) {
    const x = magnitude * Math.cos(angle);
    const y = magnitude * Math.sin(angle);
    return new Vector2D(x, y);
  }

  /**
   * Create a Vector2D from an object with x and y properties.
   * @param {Object} object - The object with x and y properties.
   * @param {number} object.x - The x coordinate.
   * @param {number} object.y - The y coordinate.
   * @returns {Vector2D} A new Vector2D instance.
   */
  static fromObject(object) {
    return new Vector2D(object.x, object.y);
  }

  /**
   * Create a Vector2D from another Vector2D instance.
   * @param {Vector2D} vec - The Vector2D instance.
   * @returns {Vector2D} A new Vector2D instance.
   */
  static fromVec2D(vec) {
    return new Vector2D(vec.x, vec.y);
  }

  /**
   * Add two vectors and return a new Vector2D instance.
   * @param {Vector2D} vec1 - The first vector.
   * @param {Vector2D} vec2 - The second vector.
   * @returns {Vector2D} The result of the addition.
   */
  static add(vec1, vec2) {
    return new Vector2D(vec1.x + vec2.x, vec1.y + vec2.y);
  }

  /**
   * Add a scalar value to each component of a vector and return a new Vector2D instance.
   * @param {Vector2D} vec - The vector to which the scalar will be added.
   * @param {number} number - The scalar value to add.
   * @returns {Vector2D} The result of the addition.
   */
  static addNumber(vec, number) {
    return new Vector2D(vec.x + number, vec.y + number);
  }

  /**
   * Subtract one vector from another and return a new Vector2D instance.
   * @param {Vector2D} vec1 - The vector to subtract from.
   * @param {Vector2D} vec2 - The vector to subtract.
   * @returns {Vector2D} The result of the subtraction.
   */
  static sub(vec1, vec2) {
    return new Vector2D(vec1.x - vec2.x, vec1.y - vec2.y);
  }

  /**
   * Scale a vector by a scalar value and return a new Vector2D instance.
   * @param {Vector2D} vec1 - The vector to scale.
   * @param {number} [number=1] - The scalar value to scale by.
   * @returns {Vector2D} The scaled vector.
   */
  static scale(vec1, number = 1) {
    return new Vector2D(vec1.x * number, vec1.y * number);
  }

  /**
   * Divide a vector by a scalar value and return a new Vector2D instance.
   * @param {Vector2D} vec1 - The vector to divide.
   * @param {number} [number=1] - The scalar value to divide by.
   * @returns {Vector2D} The divided vector.
   */
  static div(vec1, number = 1) {
    return new Vector2D(vec1.x / number, vec1.y / number);
  }

  /**
   * Add a polar coordinate to a vector and return a new Vector2D instance.
   * @param {Vector2D} vec - The vector to which the polar coordinate will be added.
   * @param {number} radius - The radius to add.
   * @param {number} angle - The angle in radians.
   * @returns {Vector2D} The resulting vector.
   */
  static addPolar(vec, radius, angle) {
    return new Vector2D(
      vec.x + radius * Math.cos(angle),
      vec.y + radius * Math.sin(angle)
    );
  }

  /**
   * Get a zero vector.
   * @returns {Vector2D} A new Vector2D instance with `x` and `y` set to 0.
   */
  static get Zero() {
    return new Vector2D();
  }

  /**
   * Get a unit vector pointing up.
   * @returns {Vector2D} A new Vector2D instance with `x = 0` and `y = 1`.
   */
  static get Up() {
    return new Vector2D(0, 1);
  }

  /**
   * Get a unit vector pointing down.
   * @returns {Vector2D} A new Vector2D instance with `x = 0` and `y = -1`.
   */
  static get Down() {
    return new Vector2D(0, -1);
  }

  /**
   * Get a unit vector pointing left.
   * @returns {Vector2D} A new Vector2D instance with `x = -1` and `y = 0`.
   */
  static get Left() {
    return new Vector2D(-1, 0);
  }

  /**
   * Get a unit vector pointing right.
   * @returns {Vector2D} A new Vector2D instance with `x = 1` and `y = 0`.
   */
  static get Right() {
    return new Vector2D(1, 0);
  }

  /**
   * Get the magnitude of the vector.
   * @returns {number} The magnitude of the vector.
   */
  get magnitude() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  /**
   * Set the magnitude of the vector.
   * @param {number} magnitude - The new magnitude.
   */
  set magnitude(magnitude) {
    const curMag = Math.sqrt(this.x * this.x + this.y * this.y);
    if (curMag === 0) {
      this.x = 0;
      this.y = 0;
    } else {
      this.x = (this.x / curMag) * magnitude;
      this.y = (this.y / curMag) * magnitude;
    }
  }

  /**
   * Get the angle of the vector in radians.
   * @returns {number} The angle in radians.
   */
  get angle() {
    return Math.atan2(this.y, this.x);
  }

  /**
   * Set the angle of the vector.
   * @param {number} angle - The new angle in radians.
   */
  set angle(angle) {
    const magnitude = this.magnitude;
    this.x = magnitude * Math.cos(angle);
    this.y = magnitude * Math.sin(angle);
  }

  /**
   * Set the `x` and `y` components of the vector.
   * @param {number} x - The new x component.
   * @param {number} y - The new y component.
   */
  set(x, y) {
    this.x = x;
    this.y = y;
  }

  /**
   * Add another vector to this vector.
   * @param {Vector2D} vec - The vector to add.
   */
  add(vec) {
    this.x += vec.x;
    this.y += vec.y;
  }

  /**
   * Add a scalar value to each component of this vector.
   * @param {number} number - The scalar value to add.
   */
  addNumber(number) {
    this.x += number;
    this.y += number;
  }

  /**
   * Add a polar coordinate to this vector.
   * @param {number} radius - The radius to add.
   * @param {number} angle - The angle in radians.
   */
  addPolar(radius, angle) {
    this.x += radius * Math.cos(angle);
    this.y += radius * Math.sin(angle);
  }

  /**
   * Subtract another vector from this vector.
   * @param {Vector2D} vec - The vector to subtract.
   */
  sub(vec) {
    this.x -= vec.x;
    this.y -= vec.y;
  }

  /**
   * Scale this vector by a scalar value.
   * @param {number} number - The scalar value to scale by.
   */
  scale(number) {
    this.x *= number;
    this.y *= number;
  }

  /**
   * Divide this vector by a scalar value.
   * @param {number} number - The scalar value to divide by.
   */
  div(number) {
    this.x /= number;
    this.y /= number;
  }

  /**
   * Clamp the magnitude of this vector between min and max values.
   * If only one parameter is provided, the vector's magnitude is clamped between `-min` and `min`.
   * @param {number} min - The minimum magnitude. If only one parameter is provided, this value is interpreted as `-min`.
   * @param {number} [max=min] - The maximum magnitude. If not provided, the vector's magnitude is clamped between `-min` and `min`.
   */
  clampMag(min, max) {
    if (typeof max === "undefined") {
      max = min;
      min = -min;
    }

    const angle = this.angle;
    const magnitude = this.magnitude;

    const clampedMagnitude = Math.max(min, Math.min(max, magnitude));

    this.x = clampedMagnitude * Math.cos(angle);
    this.y = clampedMagnitude * Math.sin(angle);
  }

  /**
   * Get the unit vector (normalized) in the same direction as this vector.
   * @returns {Vector2D} The unit vector.
   */
  unit() {
    const magnitude = this.magnitude;
    if (magnitude === 0) return new Vector2D(0, 0);
    return new Vector2D(this.x / magnitude, this.y / magnitude);
  }

  /**
   * Calculate the distance to another vector.
   * @param {Vector2D} vec - The vector to calculate distance to.
   * @returns {number} The distance.
   */
  distance(vec) {
    return Math.sqrt(
      (this.x - vec.x) * (this.x - vec.x) + (this.y - vec.y) * (this.y - vec.y)
    );
  }

  /**
   * Calculate the squared distance to another vector (no square root).
   * @param {Vector2D} vec - The vector to calculate squared distance to.
   * @returns {number} The squared distance.
   */
  distanceSquared(vec) {
    return (
      (this.x - vec.x) * (this.x - vec.x) + (this.y - vec.y) * (this.y - vec.y)
    );
  }

  /**
   * Calculate the dot product with another vector.
   * @param {Vector2D} vec - The vector to dot product with.
   * @returns {number} The dot product.
   */
  dot(vec) {
    return this.x * vec.x + this.y * vec.y;
  }

  /**
   * Rotate this vector by an angle.
   * @param {number} angle - The angle in radians to rotate by.
   * @returns {Vector2D} The rotated vector.
   */
  rotate(angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const x = this.x * cos - this.y * sin;
    const y = this.x * sin + this.y * cos;
    return new Vector2D(x, y);
  }

  /**
   * Convert this vector to an object with `x`, `y`, `angle`, and `magnitude` properties.
   * @returns {Object} The vector as an object.
   */
  toObject() {
    return {
      x: this.x,
      y: this.y,
      angle: this.angle,
      magnitude: this.magnitude,
    };
  }

  /**
   * Convert this vector to a string representation.
   * @returns {string} The string representation of the vector.
   */
  toString() {
    this.toObject().toString();
  }

  toArray() {
    return [this.x, this.y];
  }
}

export function getMousePos(canvas, evt) {
  var rect = canvas.getBoundingClientRect();
  const ratioComp = rect.width / rect.height < canvas.width / canvas.height;
  const scalingFactor = ratioComp
    ? canvas.height / rect.height
    : canvas.width / rect.width;

  const offestX = ratioComp
    ? ((canvas.width / canvas.height) * rect.height - rect.width) / 2
    : 0;
  const canvasX = (offestX + evt.clientX - rect.left) * scalingFactor;

  const offestY = !ratioComp
    ? ((canvas.height / canvas.width) * rect.width - rect.height) / 2
    : 0;
  const canvasY = (offestY + evt.clientY - rect.top) * scalingFactor;

  return new Vector2D(canvasX, canvasY);
}

/**
 * Converts an HSV color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSV_color_space.
 * Assumes h, s, and v are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   Number  h       The hue
 * @param   Number  s       The saturation
 * @param   Number  v       The value
 * @return  Array           The RGB representation
 */
export function hsvToRgb(h, s, v) {
  var r, g, b;

  var i = Math.floor(h * 6);
  var f = h * 6 - i;
  var p = v * (1 - s);
  var q = v * (1 - f * s);
  var t = v * (1 - (1 - f) * s);

  switch (i % 6) {
    case 0:
      (r = v), (g = t), (b = p);
      break;
    case 1:
      (r = q), (g = v), (b = p);
      break;
    case 2:
      (r = p), (g = v), (b = t);
      break;
    case 3:
      (r = p), (g = q), (b = v);
      break;
    case 4:
      (r = t), (g = p), (b = v);
      break;
    case 5:
      (r = v), (g = p), (b = q);
      break;
  }

  return [r * 255, g * 255, b * 255];
}

/**
 * Convert an RGB array to a HEX color string.
 * @param {number[]} rgb - An array containing the RGB values [r, g, b], where each value is between 0 and 255.
 * @returns {string} The HEX color string in the format "#RRGGBB".
 */
export function rgbToHex(rgb) {
  const r = Math.max(0, Math.min(255, rgb[0]));
  const g = Math.max(0, Math.min(255, rgb[1]));
  const b = Math.max(0, Math.min(255, rgb[2]));

  const rHex = r.toString(16).padStart(2, "0");
  const gHex = g.toString(16).padStart(2, "0");
  const bHex = b.toString(16).padStart(2, "0");

  return `#${rHex}${gHex}${bHex}`;
}

/**
 * Convert RGB color values to HSV (Hue, Saturation, Value).
 * @param {number} r - The red color value, between 0 and 255.
 * @param {number} g - The green color value, between 0 and 255.
 * @param {number} b - The blue color value, between 0 and 255.
 * @returns {number[]} An array containing the HSV values [h, s, v].
 *   - `h` (hue) is a value between 0 and 1.
 *   - `s` (saturation) is a value between 0 and 1.
 *   - `v` (value) is a value between 0 and 1.
 */
export function rgb2hsv(r, g, b) {
  let v = Math.max(r, g, b);
  let c = v - Math.min(r, g, b);
  let h =
    c && (v == r ? (g - b) / c : v == g ? 2 + (b - r) / c : 4 + (r - g) / c);
  return [(60 * (h < 0 ? h + 6 : h)) / 360, v && c / v, v];
}

/**
 * Convert a HEX color string to an RGB array.
 * @param {string} hex - The HEX color string in the format "#RRGGBB".
 * @returns {number[]} An array containing the RGB values [r, g, b], where each value is between 0 and 255.
 */
export function hexToRgbArray(hex) {
  hex = hex.replace("#", "");

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return [r, g, b];
}

/**
 * Calculate the intersection points of two circles.
 * @param {Vector2D} p1 - The center of the first circle.
 * @param {Vector2D} p2 - The center of the second circle.
 * @param {number} r1 - The radius of the first circle.
 * @param {number} r2 - The radius of the second circle.
 * @returns {Vector2D[]} An array containing the intersection points. If there are no intersection points, an empty array is returned.
 */
export function getIntercectionPoint(p1, p2, r1, r2) {
  const { x: x1, y: y1 } = p1.toObject();
  const { x: x2, y: y2 } = p2.toObject();

  const d = Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));

  if (d > r1 + r2 || d < Math.abs(r1 - r2)) {
    return []; // No solution
  }

  const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
  const x3 = x1 + (a * (x2 - x1)) / d;
  const y3 = y1 + (a * (y2 - y1)) / d;

  const h = Math.sqrt(r1 * r1 - a * a);

  const x4_1 = x3 + (h * (y2 - y1)) / d;
  const y4_1 = y3 - (h * (x2 - x1)) / d;

  const x4_2 = x3 - (h * (y2 - y1)) / d;
  const y4_2 = y3 + (h * (x2 - x1)) / d;

  return [new Vector2D(x4_1, y4_1), new Vector2D(x4_2, y4_2)];
}

/**
 * Convert a color name to its corresponding HEX color code.
 * @param {string} color - The color name (e.g., "red", "blue", "aliceblue").
 * @returns {string} The HEX color code (e.g., "#ff0000"). If the color name is not found, the original input is returned.
 */
export function colorNameToHex(color) {
  var colors = {
    aliceblue: "#f0f8ff",
    antiquewhite: "#faebd7",
    aqua: "#00ffff",
    aquamarine: "#7fffd4",
    azure: "#f0ffff",
    beige: "#f5f5dc",
    bisque: "#ffe4c4",
    black: "#000000",
    blanchedalmond: "#ffebcd",
    blue: "#0000ff",
    blueviolet: "#8a2be2",
    brown: "#a52a2a",
    burlywood: "#deb887",
    cadetblue: "#5f9ea0",
    chartreuse: "#7fff00",
    chocolate: "#d2691e",
    coral: "#ff7f50",
    cornflowerblue: "#6495ed",
    cornsilk: "#fff8dc",
    crimson: "#dc143c",
    cyan: "#00ffff",
    darkblue: "#00008b",
    darkcyan: "#008b8b",
    darkgoldenrod: "#b8860b",
    darkgray: "#a9a9a9",
    darkgreen: "#006400",
    darkkhaki: "#bdb76b",
    darkmagenta: "#8b008b",
    darkolivegreen: "#556b2f",
    darkorange: "#ff8c00",
    darkorchid: "#9932cc",
    darkred: "#8b0000",
    darksalmon: "#e9967a",
    darkseagreen: "#8fbc8f",
    darkslateblue: "#483d8b",
    darkslategray: "#2f4f4f",
    darkturquoise: "#00ced1",
    darkviolet: "#9400d3",
    deeppink: "#ff1493",
    deepskyblue: "#00bfff",
    dimgray: "#696969",
    dodgerblue: "#1e90ff",
    firebrick: "#b22222",
    floralwhite: "#fffaf0",
    forestgreen: "#228b22",
    fuchsia: "#ff00ff",
    gainsboro: "#dcdcdc",
    ghostwhite: "#f8f8ff",
    gold: "#ffd700",
    goldenrod: "#daa520",
    gray: "#808080",
    green: "#008000",
    greenyellow: "#adff2f",
    honeydew: "#f0fff0",
    hotpink: "#ff69b4",
    indianred: "#cd5c5c",
    indigo: "#4b0082",
    ivory: "#fffff0",
    khaki: "#f0e68c",
    lavender: "#e6e6fa",
    lavenderblush: "#fff0f5",
    lawngreen: "#7cfc00",
    lemonchiffon: "#fffacd",
    lightblue: "#add8e6",
    lightcoral: "#f08080",
    lightcyan: "#e0ffff",
    lightgoldenrodyellow: "#fafad2",
    lightgrey: "#d3d3d3",
    lightgreen: "#90ee90",
    lightpink: "#ffb6c1",
    lightsalmon: "#ffa07a",
    lightseagreen: "#20b2aa",
    lightskyblue: "#87cefa",
    lightslategray: "#778899",
    lightsteelblue: "#b0c4de",
    lightyellow: "#ffffe0",
    lime: "#00ff00",
    limegreen: "#32cd32",
    linen: "#faf0e6",
    magenta: "#ff00ff",
    maroon: "#800000",
    mediumaquamarine: "#66cdaa",
    mediumblue: "#0000cd",
    mediumorchid: "#ba55d3",
    mediumpurple: "#9370d8",
    mediumseagreen: "#3cb371",
    mediumslateblue: "#7b68ee",
    mediumspringgreen: "#00fa9a",
    mediumturquoise: "#48d1cc",
    mediumvioletred: "#c71585",
    midnightblue: "#191970",
    mintcream: "#f5fffa",
    mistyrose: "#ffe4e1",
    moccasin: "#ffe4b5",
    navajowhite: "#ffdead",
    navy: "#000080",
    oldlace: "#fdf5e6",
    olive: "#808000",
    olivedrab: "#6b8e23",
    orange: "#ffa500",
    orangered: "#ff4500",
    orchid: "#da70d6",
    palegoldenrod: "#eee8aa",
    palegreen: "#98fb98",
    paleturquoise: "#afeeee",
    palevioletred: "#d87093",
    papayawhip: "#ffefd5",
    peachpuff: "#ffdab9",
    peru: "#cd853f",
    pink: "#ffc0cb",
    plum: "#dda0dd",
    powderblue: "#b0e0e6",
    purple: "#800080",
    rebeccapurple: "#663399",
    red: "#ff0000",
    rosybrown: "#bc8f8f",
    royalblue: "#4169e1",
    saddlebrown: "#8b4513",
    salmon: "#fa8072",
    sandybrown: "#f4a460",
    seagreen: "#2e8b57",
    seashell: "#fff5ee",
    sienna: "#a0522d",
    silver: "#c0c0c0",
    skyblue: "#87ceeb",
    slateblue: "#6a5acd",
    slategray: "#708090",
    snow: "#fffafa",
    springgreen: "#00ff7f",
    steelblue: "#4682b4",
    tan: "#d2b48c",
    teal: "#008080",
    thistle: "#d8bfd8",
    tomato: "#ff6347",
    turquoise: "#40e0d0",
    violet: "#ee82ee",
    wheat: "#f5deb3",
    white: "#ffffff",
    whitesmoke: "#f5f5f5",
    yellow: "#ffff00",
    yellowgreen: "#9acd32",
  };

  if (typeof colors[color.toLowerCase()] != "undefined")
    return colors[color.toLowerCase()];

  return color;
}

export { Vector2D };
