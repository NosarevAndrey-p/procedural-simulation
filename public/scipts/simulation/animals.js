import {
  Vector2D,
  hsvToRgb,
  rgbToHex,
  rgb2hsv,
  hexToRgbArray,
  getIntercectionPoint,
  colorNameToHex,
} from "./utils.js";

class BodyBase {
  /**
   * Creates an instance of BodyBase.
   * @param {number[]} radiusesArray - Array of radiuses for the body segments.
   * @param {number} spacing - Spacing between the segments.
   * @param {number} maxAngle - Maximum angle allowed between segments.
   * @param {Vector2D} [basisPosition=Vector2D.Zero] - Initial position of the body.
   * @param {number} [headPoints=5] - Number of points for the head shape.
   * @param {number} [tailPoints=5] - Number of points for the tail shape.
   * @param {number} [eyesAngle=90] - Angle between the eyes in degrees.
   * @param {number} [eyesRadius=5] - Radius of the eyes.
   * @param {number} [eyesPosRadius=12] - Radius for the position of the eyes.
   * @param {Object} [style={}] - Style settings for the body.
   * @param {string} [style.outline="white"] - Color of the outline.
   * @param {number} [style.outlineWidth=2] - Width of the outline.
   * @param {string} [style.fill="random"] - Fill color of the body. Allowed values: a color name, a hex code, or the keyword "random". If "random" is used, a random fill is assigned with HSV equivalent `[0 to 1), 0.6, 0.9`.
   * @param {string} [style.eyesColor="black"] - Color of the eyes.
   * @param {number} [scale=1] - Scale of the body.
   * @param {boolean} [displayQuads=true] - Whether to display body segments as quads.
   */
  constructor(
    radiusesArray,
    spacing,
    maxAngle,
    basisPosition = Vector2D.Zero,
    headPoints = 5,
    tailPoints = 5,
    eyesAngle = 90,
    eyesRadius = 5,
    eyesPosRadius = 12,
    style = {
      outline: "white",
      outlineWidth: 2,
      fill: "random",
      eyesColor: "black",
    },
    scale = 1,
    displayQuads = true
  ) {
    if (style.fill === "random") {
      style.fillHSV = [Math.random(), 0.6, 0.9];
      const color = hsvToRgb(...style.fillHSV).map((num) => Math.floor(num));
      style.fill = rgbToHex(color);
    } else {
      style.fill = colorNameToHex(style.fill);
    }
    this.chainLinks;
    this.spacing;
    this.maxAngle;
    this.totalCurvature = 0;
    this.headPoints;
    this.tailPoints;
    this.eyesAngle = eyesAngle;
    this.eyesRadius = eyesRadius;
    this.eyesPosRadius = eyesPosRadius;
    this.style = style;
    radiusesArray =
      radiusesArray.length == 0
        ? [10, 10]
        : radiusesArray.length == 1
        ? [radiusesArray[0], radiusesArray[0]]
        : radiusesArray;
    this.setCustomBodyShape(
      radiusesArray,
      spacing,
      maxAngle,
      headPoints,
      tailPoints,
      basisPosition
    );

    this._scale = Math.abs(scale);
    this.displayQuads = displayQuads;

    //init render staff with webGL
    this.graphicContainer = new PIXI.Container();
    this.graficElements = {};
    this.bodyPoints = [];
  }

  /**
   * Sets a custom body shape based on the provided parameters.
   * @param {number[]} radiusesArray - Array of radiuses for the body segments.
   * @param {number} spacing - Spacing between the segments.
   * @param {number} maxAngle - Maximum angle allowed between segments.
   * @param {number} headPoints - Number of points for the head shape.
   * @param {number} tailPoints - Number of points for the tail shape.
   * @param {Vector2D} [pos=Vector2D.Zero] - Initial position of the body.
   */
  setCustomBodyShape(
    radiusesArray,
    spacing,
    maxAngle,
    headPoints,
    tailPoints,
    pos = Vector2D.Zero
  ) {
    let currentPos = pos;
    if (typeof this.chainLinks !== "undefined") {
      currentPos = this.chainLinks[0].pos;
    }
    this.chainLinks = radiusesArray.map((radius, index) => {
      const posY = currentPos.y + spacing * index;
      const pos = new Vector2D(currentPos.x, posY);
      return new ChainLink(radius, pos);
    });
    this.spacing = spacing;
    this.maxAngle = maxAngle;
    this.headPoints = Math.max(2, headPoints);
    this.tailPoints = Math.max(2, tailPoints);
  }

  /**
   * Updates the positions and directions of the body segments.
   * @param {Vector2D} pos - New position for the first segment.
   */
  update(pos) {
    const link1 = this.chainLinks[0];
    const link2 = this.chainLinks[1];

    const currentAngle = Vector2D.sub(link2.pos, pos).angle;

    link1.pos = pos;

    link1.directionAngle = currentAngle;
    link2.pos = Vector2D.addPolar(
      link1.pos,
      this.spacing * this.scale,
      currentAngle
    );
    link2.directionAngle = currentAngle;

    for (let index = 2; index < this.chainLinks.length; index++) {
      this.chainLinks[index].update(
        this.chainLinks[index - 1],
        this.spacing * this.scale,
        this.chainLinks[index - 2],
        this.maxAngle
      );
    }

    this.totalCurvature = this.getTotalCurvature();
  }

  /**
   * Displays the outline of each body segment on the canvas.
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
   */
  displaySkeleton(ctx) {
    this.chainLinks.forEach((link) => link.displayOutline(ctx, this.scale));

    this.chainLinks.forEach((link) => {
      const poligonPoints = link.getSidePoints(this.scale);

      const colorArray = ["red", "blue"];
      poligonPoints.forEach((point, index) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = colorArray[index];
        ctx.fill();
        ctx.closePath();
      });
    });
  }

  /**
   * Displays the head or tail of the body on the canvas.
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
   * @param {boolean} isHead - Whether to display the head (`true`) or tail (`false`).
   */
  displayBodyEnd(ctx, isHead) {
    ctx.strokeStyle = this.style.outline;
    ctx.lineWidth = this.style.outlineWidth;
    ctx.fillStyle = this.style.fill;

    const endPoints = this.getEndPoints(isHead);
    const start = endPoints[0];
    const end = endPoints[endPoints.length - 1];
    endPoints[0].x = start.y > end.y ? start.x + 0.5 : start.x - 0.5;
    endPoints[0].y = start.x > end.x ? start.y - 0.5 : start.y + 0.5;

    endPoints[endPoints.length - 1].x =
      start.y > end.y ? end.x + 0.5 : end.x - 0.5;
    endPoints[endPoints.length - 1].y =
      start.x > end.x ? end.y - 0.5 : end.y + 0.5;

    ctx.beginPath();
    ctx.moveTo(endPoints[0].x, endPoints[0].y);
    for (let i = 1; i < endPoints.length; i++) {
      ctx.lineTo(endPoints[i].x, endPoints[i].y);
    }
    ctx.closePath();
    ctx.fill();

    if (this.style.outlineWidth > 0) {
      ctx.beginPath();
      ctx.moveTo(endPoints[0].x, endPoints[0].y);
      for (let i = 1; i < endPoints.length; i++) {
        ctx.lineTo(endPoints[i].x, endPoints[i].y);
      }

      ctx.stroke();
      ctx.closePath();
    }
  }

  /**
   * Displays the entire body on the canvas, including the head and tail.
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
   */
  display(ctx) {
    ctx.strokeStyle = this.style.outline;
    ctx.lineWidth = this.style.outlineWidth;
    ctx.fillStyle = this.style.fill;

    this.displayBodyEnd(ctx, false);

    if (this.displayQuads) this.displayBodyQuads(ctx);
    else this.displayBodySingleShape(ctx);

    this.displayBodyEnd(ctx, true);

    this.displayEyes(ctx);
  }

  /**
   * Displays the body segments as quads on the canvas. Resource intensive, but don't have visual glitches on body overlap.
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
   */
  displayBodyQuads(ctx) {
    const sidePoints = this.chainLinks
      .map((link) => link.getSidePoints(this.scale))
      .reverse();

    for (let i = 1; i < sidePoints.length; i++) {
      const vert1 = sidePoints[i - 1];
      const vert2 = sidePoints[i];

      ctx.beginPath();
      ctx.moveTo(vert1[0].x, vert1[0].y);
      ctx.lineTo(vert1[1].x, vert1[1].y);

      const vert2new = [
        {
          x: vert1[0].x < vert2[0].x ? vert2[0].x + 0.5 : vert2[0].x - 0.5,
          y: vert1[0].y < vert2[0].y ? vert2[0].y + 0.5 : vert2[0].y - 0.5,
        },
        {
          x: vert1[1].x < vert2[1].x ? vert2[1].x + 0.5 : vert2[1].x - 0.5,
          y: vert1[1].y < vert2[1].y ? vert2[1].y + 0.5 : vert2[1].y - 0.5,
        },
      ];
      ctx.lineTo(vert2new[1].x, vert2new[1].y);
      ctx.lineTo(vert2new[0].x, vert2new[0].y);
      ctx.closePath();
      ctx.fill();

      if (this.style.outlineWidth > 0) {
        ctx.beginPath();
        ctx.moveTo(vert1[1].x, vert1[1].y);
        ctx.lineTo(vert2[1].x, vert2[1].y);

        ctx.stroke();
        ctx.closePath();

        ctx.beginPath();
        ctx.moveTo(vert1[0].x, vert1[0].y);
        ctx.lineTo(vert2[0].x, vert2[0].y);
        ctx.stroke();
        ctx.closePath();
      }
    }
  }

  /**
   * Displays the body as a single shape on the canvas. Fast, but has visual glitches on body overlaps.
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
   */
  displayBodySingleShape(ctx) {
    const sidePoints = this.chainLinks.map((link) =>
      link.getSidePoints(this.scale)
    );
    const toBack = sidePoints.map((points) => points[0]);
    const toHead = sidePoints.map((points) => points[1]);

    ctx.beginPath(ctx);
    ctx.moveTo(toBack[0].x, toBack[0].y);
    for (let i = 1; i < toBack.length; i++)
      ctx.lineTo(toBack[i].x, toBack[i].y);
    for (let i = toBack.length - 1; i >= 0; i--)
      ctx.lineTo(toHead[i].x, toHead[i].y);

    ctx.closePath(ctx);
    ctx.fill();

    if (this.style.outlineWidth > 0) {
      ctx.beginPath(ctx);
      ctx.moveTo(toBack[0].x, toBack[0].y);
      for (let i = 1; i < toBack.length; i++)
        ctx.lineTo(toBack[i].x, toBack[i].y);

      ctx.stroke();
      ctx.closePath(ctx);

      ctx.beginPath(ctx);
      ctx.moveTo(toHead[toHead.length - 1].x, toHead[toHead.length - 1].y);
      for (let i = toHead.length - 2; i >= 0; i--)
        ctx.lineTo(toHead[i].x, toHead[i].y);
      ctx.stroke();
      ctx.closePath(ctx);
    }
  }

  /**
   * Displays the eyes of the body on the canvas.
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
   */
  displayEyes(ctx) {
    const link = this.chainLinks[0];
    const eyeAngle = ((180 - this.eyesAngle) * Math.PI) / 180;
    const radius = this.eyesPosRadius * this.scale;

    const eyes = [
      Vector2D.addPolar(link.pos, radius, link.directionAngle + eyeAngle),
      Vector2D.addPolar(link.pos, radius, link.directionAngle - eyeAngle),
    ];

    ctx.fillStyle = this.style.eyesColor;
    eyes.forEach((eye) => {
      ctx.beginPath();
      ctx.arc(eye.x, eye.y, this.eyesRadius * this.scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.closePath();
    });
  }

  /**
   * Gets the end points (head or tail) of the body.
   * @param {boolean} isHead - Whether to get the head points (`true`) or tail points (`false`).
   * @returns {Vector2D[]} - Array of end points.
   */
  getEndPoints(isHead) {
    const link = this.chainLinks[isHead ? 0 : this.chainLinks.length - 1];
    const n = isHead ? this.headPoints : this.tailPoints;

    const points = [];
    const angleStep = Math.PI / (n - 1);

    for (let i = 0; i < n; i++) {
      const angle =
        link.directionAngle + (Math.PI / 2) * (isHead ? 1 : -1) + i * angleStep;

      points.push(Vector2D.addPolar(link.pos, link.radius * this.scale, angle));
    }
    return points;
  }

  /**
   * Calculates the total curvature of the body.
   * @returns {number} - The total curvature, normalized between -1 and 1.
   */
  getTotalCurvature() {
    const maxCurvature = this.maxAngle * (this.chainLinks.length - 2);
    let curCurvature = 0;

    for (let i = 2; i < this.chainLinks.length; i++) {
      const link1 = this.chainLinks[i - 1];
      const link2 = this.chainLinks[i];

      let difference =
        (link2.directionAngle * 180) / Math.PI -
        (link1.directionAngle * 180) / Math.PI;
      difference = difference > 180 ? difference - 360 : difference;
      difference = difference < -180 ? difference + 360 : difference;
      curCurvature += difference;
    }
    return Math.min(Math.max(curCurvature / maxCurvature, -1), 1);
  }

  set scale(scale) {
    this._scale = Math.abs(scale);
  }

  get scale() {
    return this._scale;
  }

  /**
   * Initializes the Pixi.js graphics for the body and eyes.
   */
  initPixiGrafics() {
    const sidePoints = this.chainLinks.map((link) =>
      link.getSidePoints(this.scale)
    );
    const toBack = sidePoints.map((points) => points[0].toArray()).flat(1);
    const toHead = sidePoints
      .map((points) => points[1].toArray())
      .reverse()
      .flat(1);

    let head = this.getEndPoints(true);
    head = head
      .slice(1, head.length - 1)
      .map((points) => points.toArray())
      .reverse()
      .flat(1);
    let tail = this.getEndPoints(false);
    tail = tail
      .slice(1, tail.length - 1)
      .map((points) => points.toArray())
      .reverse()
      .flat(1);

    this.bodyPoints = toBack.concat(tail).concat(toHead).concat(head);

    const body = new PIXI.Graphics();
    body.poly(this.bodyPoints);
    // square.drawRect(0, 0, 100, 100); // 100x100 square
    body.fill(this.style.fill);
    if (this.style.outlineWidth > 0) {
      body.stroke({
        width: this.style.outlineWidth,
        color: this.style.outline,
      });
    }
    this.graphicContainer.addChild(body);
    this.graficElements.body = body;

    const eyeAngle = ((180 - this.eyesAngle) * Math.PI) / 180;
    const radius = this.eyesPosRadius * this.scale;

    const eyes = [
      Vector2D.addPolar(Vector2D.Zero, radius, eyeAngle),
      Vector2D.addPolar(Vector2D.Zero, radius, -eyeAngle),
    ];

    const eyeCont = new PIXI.Container();

    const eyeLeft = new PIXI.Graphics();
    eyeLeft.circle(eyes[0].x, eyes[0].y, this.eyesRadius);
    eyeLeft.fill(this.style.eyesColor);
    eyeCont.addChild(eyeLeft);

    const eyeRight = new PIXI.Graphics();
    eyeRight.circle(eyes[1].x, eyes[1].y, this.eyesRadius);
    eyeRight.fill(this.style.eyesColor);
    eyeCont.addChild(eyeRight);

    this.graficElements.eyes = eyeCont;
    this.graphicContainer.addChild(eyeCont);
  }

  /**
   * Updates the Pixi.js graphics for the body and eyes.
   */
  updatePixiGrafics() {
    // if (this.displayQuads) {
    //   this.updatePixiQuads();
    // } else {
    //   this.updatePixiSingle();
    // }
    //TODO: implement updatePixiQuads()
    this.updatePixiSingle();

    this.updatePixiEyes();
  }

  /**
   * Updates the Pixi.js graphics for the body segments as quads.
   * TODO: implement method
   */
  updatePixiQuads() {
    // TODO: Implement updatePixiQuads
  }

  /**
   * Updates the Pixi.js graphics for the body as a single shape.
   */
  updatePixiSingle() {
    const sidePoints = this.chainLinks.map((link) =>
      link.getSidePoints(this.scale)
    );

    const t = this.getEndPoints(false);
    const h = this.getEndPoints(true);
    let offset = 0;
    for (let i = 0; i < sidePoints.length; i++) {
      this.bodyPoints[2 * i] = sidePoints[i][1].x;
      this.bodyPoints[2 * i + 1] = sidePoints[i][1].y;
    }
    offset += sidePoints.length;
    for (let i = 0; i < 0 + t.length - 2; i++) {
      this.bodyPoints[2 * (i + offset)] = t[i + 1].x;
      this.bodyPoints[2 * (i + offset) + 1] = t[i + 1].y;
    }
    offset += t.length - 2;
    for (let i = 0; i < sidePoints.length; i++) {
      this.bodyPoints[2 * (i + offset)] =
        sidePoints[sidePoints.length - i - 1][0].x;
      this.bodyPoints[2 * (i + offset) + 1] =
        sidePoints[sidePoints.length - i - 1][0].y;
    }
    offset += sidePoints.length;
    for (let i = 0; i < 0 + h.length - 2; i++) {
      this.bodyPoints[2 * (i + offset)] = h[i + 1].x;
      this.bodyPoints[2 * (i + offset) + 1] = h[i + 1].y;
    }

    const body = this.graficElements.body;
    body.clear();
    body.poly(this.bodyPoints);
    body.fill(this.style.fill);
    if (this.style.outlineWidth > 0) {
      body.stroke({
        width: this.style.outlineWidth,
        color: this.style.outline,
      });
    }
  }

  /**
   * Updates the position and rotation of the eyes in the Pixi.js graphics.
   */
  updatePixiEyes() {
    const link = this.chainLinks[0];
    this.graficElements.eyes.position.set(link.pos.x, link.pos.y);
    this.graficElements.eyes.rotation = link.directionAngle;
  }

  /**
   * Sets style for the body base.
   */
  setStyle(style) {
    if (style.fill === "random") {
      style.fillHSV = [Math.random(), 0.6, 0.9];
      const color = hsvToRgb(...style.fillHSV).map((num) => Math.floor(num));
      style.fill = rgbToHex(color);
    } else {
      style.fill = colorNameToHex(style.fill);
    }
    this.style.fill = style.fill;
    this.style.outline = style.outline;
    this.style.outlineWidth = style.outlineWidth;
    this.style.eyesColor = style.eyesColor;

    if (Object.keys(this.graficElements).length !== 0) {
      const eyeAngle = ((180 - this.eyesAngle) * Math.PI) / 180;
      const radius = this.eyesPosRadius * this.scale;

      const eyes = [
        Vector2D.addPolar(Vector2D.Zero, radius, eyeAngle),
        Vector2D.addPolar(Vector2D.Zero, radius, -eyeAngle),
      ];

      const gEyes = this.graficElements.eyes.children;
      gEyes[0].clear();
      gEyes[0].circle(eyes[0].x, eyes[0].y, this.eyesRadius);
      gEyes[0].fill(this.style.eyesColor);
      gEyes[1].clear();
      gEyes[1].circle(eyes[1].x, eyes[1].y, this.eyesRadius);
      gEyes[1].fill(this.style.eyesColor);
    }
  }

  destroy() {
    if (this.graphicContainer) {
      if (this.graphicContainer.parent) {
        this.graphicContainer.parent.removeChild(this.graphicContainer);
      }

      this.graphicContainer.destroy({
        children: true,
        texture: true,
        baseTexture: true,
      });
      this.graphicContainer = null;
    }
  }
}

class ChainLink {
  /**
   * Creates an instance of ChainLink.
   * @param {number} radius - The radius of the chain link.
   * @param {Vector2D} [pos=Vector2D.Zero] - The initial position of the chain link.
   */
  constructor(radius, pos = Vector2D.Zero) {
    this.radius = radius;
    this.pos = Vector2D.fromObject(pos);
    this.directionAngle = -Math.PI / 2;
  }

  /**
   * Updates the position of the chain link based on angle and distance constraints.
   * @param {ChainLink} distConstrainer - The chain link that constrains the distance.
   * @param {number} distance - The desired distance from the distConstrainer.
   * @param {ChainLink} angleConstrainer - The chain link that constrains the angle.
   * @param {number} [maxAngle=0] - The maximum allowed angle difference in degrees.
   */
  update(distConstrainer, distance, angleConstrainer, maxAngle = 0) {
    const baseVector = Vector2D.sub(angleConstrainer.pos, distConstrainer.pos);
    const anchorAngle = baseVector.angle;

    const vector = Vector2D.sub(this.pos, distConstrainer.pos);
    const currentAngle = vector.angle;

    this.directionAngle = currentAngle;

    let angleDiff = currentAngle - anchorAngle;

    if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
    else if (angleDiff <= -Math.PI) angleDiff += 2 * Math.PI;

    const maxAngleRad = ((180 - maxAngle) * Math.PI) / 180;

    const newAngle =
      angleDiff < 0
        ? Math.min(angleDiff, -maxAngleRad) + anchorAngle
        : Math.max(angleDiff, maxAngleRad) + anchorAngle;

    this.pos = Vector2D.addPolar(distConstrainer.pos, distance, newAngle);
  }

  /**
   * Returns the side points of the chain link based on its direction angle and scale.
   * @param {number} scale - The scale factor for the radius.
   * @returns {Vector2D[]} The side points of the chain link.
   */
  getSidePoints(scale) {
    const radius = this.radius * scale;
    return [
      Vector2D.addPolar(this.pos, radius, this.directionAngle + Math.PI / 2),
      Vector2D.addPolar(this.pos, radius, this.directionAngle - Math.PI / 2),
    ];
  }

  /**
   * Displays the outline of the chain link on the given canvas context.
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
   * @param {number} scale - The scale factor for the radius.
   */
  displayOutline(ctx, scale) {
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, this.radius * scale, 0, Math.PI * 2, true);
    ctx.stroke();
    ctx.closePath();
  }
}

/**
 * Constructs a SideFin object.
 * @constructor
 * @param {ChainLink} link - The ChainLink object to which the side fin is attached.
 * @param {number} angle - The angle at which the side fin is oriented, in radians.
 * @param {number} radiusX - The horizontal radius of the side fin.
 * @param {number} radiusY - The vertical radius of the side fin.
 */
function SideFin(link, angle, radiusX, radiusY) {
  this.link = link;
  this.angle = angle;
  this.radiusX = radiusX;
  this.radiusY = radiusY;
}

/**
 * Represents a Fish, extending the BodyBase class.
 * @class
 * @extends BodyBase
 */
class Fish extends BodyBase {
  /**
   * Creates an instance of Fish.
   * @param {Vector2D} [basisPosition=Vector2D.Zero] - The initial position of the fish.
   * @param {Object} [style={}] - The styling options for the fish.
   * @param {string} [style.outline="white"] - The outline color of the fish.
   * @param {number} [style.outlineWidth=2] - The outline width of the fish.
   * @param {string} [style.fill="random"] - The fill color of the body. Allowed values: color name, hex code, or "random".
   * @param {string} [style.eyesColor="black"] - The color of the eyes.
   * @param {number} [scale=1] - The scale of the fish.
   * @param {boolean} [isLowRes=true] - Whether to use low resolution for the fish.
   */
  constructor(
    basisPosition = Vector2D.Zero,
    style = {
      outline: "white",
      outlineWidth: 2,
      fill: "random",
      eyesColor: "black",
    },
    scale = 1,
    isLowRes = true
  ) {
    const radiusArray = isLowRes
      ? [14, 16.25, 17, 16.25, 14, 10, 7.5, 5.5]
      : [14, 16, 16.5, 17, 17, 16.5, 16, 15, 13, 11, 9, 8, 7, 6, 5];
    const dist = isLowRes ? 16 : 8;
    const ang = isLowRes ? 32 : 16;
    const finLinks = isLowRes ? [3, 6, 3, 7] : [5, 12, 5, 12];

    super(
      radiusArray,
      dist,
      ang,
      basisPosition,
      10,
      7,
      80,
      2.5,
      11,
      style,
      scale,
      false
    );
    if (!this.style.finFill) {
      if (this.style.fillHSV) {
        const hsv = this.style.fillHSV;
        let color = hsvToRgb(hsv[0], hsv[1] - 0.3, hsv[2]);
        color = color.map((num) => Math.floor(num));
        style.finFill = rgbToHex(color);
      } else {
        style.finFill = this.style.fill;
        if (this.style.fill[0] === "#") {
          const colorArr = hexToRgbArray(this.style.fill).map((v) => v / 256);
          const hsv = rgb2hsv(...colorArr);

          let color = hsvToRgb(hsv[0], hsv[1] * 0.7, Math.max(hsv[2] * 1.3, 1));

          color = color.map((num) => Math.floor(num));
          style.finFill = rgbToHex(color);
        }
      }
    }
    this.sideFins = [
      new SideFin(finLinks[0], 45, 16, 8),
      new SideFin(finLinks[1], 45, 12, 4),
    ];
    this.topFin = { linkRange: [finLinks[2], finLinks[3]], offset: 14 };
    this.tailFin = {
      length: 32,
      offsetMinEnd: 5,
      offsetMaxEnd: 16,
      offsetStart: 2.5,
    };
    this.update(basisPosition);
  }

  /**
   * Displays the fish on the provided canvas context.
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
   */
  display(ctx) {
    ctx.fillStyle = this.style.finFill ? this.style.finFill : this.style.fill;
    ctx.strokeStyle = this.style.outline;
    ctx.lineWidth = this.style.outlineWidth;
    this.displaySideFins(ctx);
    this.displayTailFin(ctx);

    super.display(ctx);

    ctx.fillStyle = this.style.finFill ? this.style.finFill : this.style.fill;
    ctx.strokeStyle = this.style.outline;
    ctx.lineWidth = this.style.outlineWidth;
    this.displayTopFin(ctx);
  }

  /**
   * Displays the side fins of the fish.
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
   */
  displaySideFins(ctx) {
    this.sideFins.forEach((finData) => {
      const link = this.chainLinks[finData.link];
      const dirAngle = link.directionAngle;
      const directionLink = this.chainLinks[finData.link - 1];
      const radius = link.radius * this.scale;

      const fin1Pos = Vector2D.addPolar(
        link.pos,
        radius,
        dirAngle + Math.PI / 2
      );
      const fin2Pos = Vector2D.addPolar(
        link.pos,
        radius,
        dirAngle - Math.PI / 2
      );

      const fins = [fin1Pos, fin2Pos];
      const rotations = [
        directionLink.directionAngle + (finData.angle * Math.PI) / 180,
        directionLink.directionAngle - (finData.angle * Math.PI) / 180,
      ];
      fins.forEach((fin, index) => {
        ctx.beginPath();
        ctx.ellipse(
          fin.x,
          fin.y,
          finData.radiusX * this.scale,
          finData.radiusY * this.scale,
          rotations[index],
          0,
          Math.PI * 2
        );

        ctx.fill();
        if (this.style.outlineWidth > 0) {
          ctx.stroke();
        }

        ctx.closePath();
      });
    });
  }

  /**
   * Displays the top fin of the fish.
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
   */
  displayTopFin(ctx) {
    const { spine, control } = this.getTopPoints();

    ctx.moveTo(spine[0].x, spine[0].y);

    ctx.beginPath();
    for (let i = 0; i < spine.length; i++) {
      ctx.lineTo(spine[i].x, spine[i].y);
    }

    ctx.quadraticCurveTo(control.x, control.y, spine[0].x, spine[0].y);

    ctx.fill();
    if (this.style.outlineWidth > 0) {
      ctx.stroke();
    }
    ctx.closePath();
  }

  /**
   * Displays the tail fin of the fish.
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
   */
  displayTailFin(ctx) {
    const points = this.getTailPoints();

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    ctx.quadraticCurveTo(points[1].x, points[1].y, points[2].x, points[2].y);
    ctx.lineTo(points[3].x, points[3].y);
    ctx.quadraticCurveTo(points[4].x, points[4].y, points[5].x, points[5].y);
    ctx.closePath();

    ctx.fill();
    if (this.style.outlineWidth > 0) {
      ctx.stroke();
    }
  }

  /**
   * Calculates the points defining the tail fin of the fish.
   * @returns {Vector2D[]} An array of points representing the tail fin.
   */
  getTailPoints() {
    const lastLink = this.chainLinks[this.chainLinks.length - 1];
    const length = this.tailFin.length * this.scale;
    const start = lastLink.pos;

    const end = Vector2D.addPolar(start, length, lastLink.directionAngle);

    const mid = Vector2D.add(start, end);
    mid.div(2);

    const dirVec = Vector2D.sub(start, end);
    const unitVector = dirVec.unit();
    const perpVector = new Vector2D(-unitVector.y, unitVector.x);

    const offsetEndMin =
      this.totalCurvature * this.tailFin.offsetMinEnd * this.scale;
    const endMin = Vector2D.sub(end, Vector2D.scale(perpVector, offsetEndMin));

    const offsetEndMax =
      this.totalCurvature * this.tailFin.offsetMaxEnd * this.scale;
    const endMax = Vector2D.sub(end, Vector2D.scale(perpVector, offsetEndMax));

    const offsetStart =
      this.totalCurvature * this.tailFin.offsetStart * this.scale;
    const startMin = Vector2D.add(
      start,
      Vector2D.scale(perpVector, offsetStart)
    );
    const startMax = Vector2D.sub(
      start,
      Vector2D.scale(perpVector, offsetStart)
    );

    return [startMin, mid, endMin, endMax, mid, startMax];
  }

  /**
   * Calculates the points defining the top fin of the fish.
   * @returns {Object} An object containing the `spine` points and `control` point for the top fin.
   */
  getTopPoints() {
    const finLinks = this.chainLinks
      .slice(...this.topFin.linkRange)
      .map((link) => link.pos);

    const point1 = finLinks[0];
    const point2 = finLinks[finLinks.length - 1];
    const offset = this.topFin.offset * this.totalCurvature * this.scale;

    const midPoint = Vector2D.add(point1, point2);
    midPoint.scale(0.5);

    const dirVec = Vector2D.sub(point1, point2);
    const unitVector = dirVec.unit();
    const perpVector = new Vector2D(-unitVector.y, unitVector.x);

    const controlPoint = Vector2D.add(
      midPoint,
      Vector2D.scale(perpVector, offset)
    );

    return { spine: finLinks, control: controlPoint };
  }

  /**
   * Initializes the PIXI graphics for the fish.
   */
  initPixiGrafics() {
    super.initPixiGrafics();

    this.graficElements.sideFins = [];
    this.sideFins.forEach((finData) => {
      const link = this.chainLinks[finData.link];
      const finsContanier = new PIXI.Container();

      const finLeft = new PIXI.Graphics();
      finLeft.ellipse(
        0,
        0,
        finData.radiusX * this.scale,
        finData.radiusY * this.scale
      );
      finLeft.position.set(0, link.radius * this.scale);
      finLeft.angle = finData.angle;
      finLeft.fill(this.style.finFill);
      if (this.style.outlineWidth > 0) {
        finLeft.stroke({
          width: this.style.outlineWidth,
          color: this.style.outline,
        });
      }

      const finRight = new PIXI.Graphics();
      finRight.ellipse(
        0,
        0,
        finData.radiusX * this.scale,
        finData.radiusY * this.scale
      );
      finRight.position.set(0, -link.radius * this.scale);
      finRight.angle = -finData.angle;
      finRight.fill(this.style.finFill);
      if (this.style.outlineWidth > 0) {
        finRight.stroke({
          width: this.style.outlineWidth,
          color: this.style.outline,
        });
      }

      finsContanier.addChild(finLeft);
      finsContanier.addChild(finRight);

      this.graficElements.sideFins.push(finsContanier);
      this.graphicContainer.addChildAt(finsContanier, 0);
    });

    const tailFin = new PIXI.Graphics();
    this.graficElements.tailFin = tailFin;
    this.graphicContainer.addChildAt(tailFin, 0);

    const topFin = new PIXI.Graphics();
    this.graficElements.topFin = topFin;
    this.graphicContainer.addChild(topFin);

    this.updatePixiGrafics();
  }

  /**
   * Updates the PIXI graphics for the fish.
   */
  updatePixiGrafics() {
    super.updatePixiGrafics();

    this.sideFins.forEach((finData, index) => {
      const link = this.chainLinks[finData.link];
      const link2 = this.chainLinks[finData.link - 1];
      const container = this.graficElements.sideFins[index];
      container.position.set(link.pos.x, link.pos.y);
      container.rotation = link2.directionAngle;
    });

    const points = this.getTailPoints();
    const tailFin = this.graficElements.tailFin;

    tailFin.clear();
    tailFin.moveTo(points[0].x, points[0].y);
    tailFin.quadraticCurveTo(
      points[1].x,
      points[1].y,
      points[2].x,
      points[2].y
    );
    tailFin.lineTo(points[3].x, points[3].y);
    tailFin.quadraticCurveTo(
      points[4].x,
      points[4].y,
      points[5].x,
      points[5].y
    );
    tailFin.fill(this.style.finFill);

    if (this.style.outlineWidth > 0) {
      tailFin.stroke({
        width: this.style.outlineWidth,
        color: this.style.outline,
        cap: "round",
      });
    }

    const topFin = this.graficElements.topFin;
    const { spine, control } = this.getTopPoints();

    topFin.clear();
    topFin.moveTo(spine[0].x, spine[0].y);
    for (let i = 0; i < spine.length; i++) {
      topFin.lineTo(spine[i].x, spine[i].y);
    }
    topFin.quadraticCurveTo(control.x, control.y, spine[0].x, spine[0].y);
    topFin.fill(this.style.finFill);
    if (this.style.outlineWidth > 0) {
      topFin.stroke({
        width: this.style.outlineWidth,
        color: this.style.outline,
      });
    }
  }

  /**
   * Sets style for the fish.
   * @param {Object} style - Fish styling object.
   */
  setStyle(style) {
    super.setStyle(style);

    if (!style.finFill) {
      this.style.finFill = this.style.fill;

      if (this.style.fill[0] === "#") {
        const colorArr = hexToRgbArray(this.style.fill).map((v) => v / 256);
        const hsv = rgb2hsv(...colorArr);

        let color = hsvToRgb(hsv[0], hsv[1] * 0.7, Math.max(hsv[2] * 1.3, 1));
        color = color.map((num) => Math.floor(num));
        this.style.finFill = rgbToHex(color);
      }
    } else {
      this.style.finFill = style.finFill;
    }

    if (Object.keys(this.graficElements).length !== 0) {
      this.graficElements.sideFins.forEach((container) => {
        container.children.forEach((ellipse) => {
          ellipse.fill(this.style.finFill);
          ellipse.stroke({
            width: this.style.outlineWidth,
            color: this.style.outline,
          });
        });
      });
    }
  }
}

/**
 * Represents a Snake, extending the BodyBase class.
 * @class
 * @extends BodyBase
 */
class Snake extends BodyBase {
  /**
   * Creates an instance of Snake.
   * @param {Vector2D} [basisPosition=Vector2D.Zero] - The initial position of the snake.
   * @param {Object} [style={}] - The styling options for the snake.
   * @param {string} [style.outline="white"] - The outline color of the snake.
   * @param {number} [style.outlineWidth=2] - The outline width of the snake.
   * @param {string} [style.fill="random"] - The fill color of the body. Allowed values: color name, hex code, or "random".
   * @param {string} [style.eyesColor="black"] - The color of the eyes.
   * @param {number} [scale=1] - The scale of the snake.
   */
  constructor(
    basisPosition = Vector2D.Zero,
    style = {
      outline: "white",
      outlineWidth: 2,
      fill: "random",
      eyesColor: "black",
    },
    scale = 1
  ) {
    const radArray = [
      14, 18, 19.5, 17, 15.0, 14.76, 14.52, 14.28, 14.04, 13.8, 13.56, 13.32,
      13.08, 12.84, 12.6, 12.36, 12.12, 11.88, 11.64, 11.4, 11.16, 10.92, 10.68,
      10.44, 10.2, 9.96, 9.72, 9.48, 9.24, 9.0, 8.76, 8.52, 8.28, 8.04, 7.8,
      7.56, 7.32, 7.08, 6.84, 6.6, 6.36, 6.12, 5.88, 5.64, 5.4, 5.16, 4.92,
      4.68, 4.44, 4.2, 3.96, 3.72, 3.48, 3.24, 3.0,
    ];

    super(
      radArray,
      13,
      20,
      basisPosition,
      8,
      5,
      110,
      3,
      12,
      style,
      scale,
      true,
      true
    );
    this.update(basisPosition);
  }
}

/**
 * Represents a 3-joint leg mechanism with two segments connected by a hinge.
 * @class
 */
class Leg3Joint {
  /**
   * Creates an instance of Leg3Joint.
   * @param {Object} link - The link that the joint is attached to.
   * @param {number} shoulderWidth - The width of the shoulder.
   * @param {boolean} isShoulderRight - Indicates if the shoulder is on the right side.
   * @param {number} length1 - The length of the first segment.
   * @param {number} length2 - The length of the second segment.
   * @param {Object} constrains - Constraints for the joint.
   * @param {number} [constrains.anchorAngle=0] - The angle of the anchor point relative to the link.
   * @param {number} [constrains.anchorDistance=0] - The distance of the anchor point from the link.
   * @param {number} [constrains.maxDifference=0] - The maximum allowed distance difference for the joint.
   * @param {number} [returnSpeed=2] - The speed at which the joint returns to its target point.
   * @param {boolean} [isForwardBend=true] - Indicates if the joint bends forward (`true`) or backward (`false`).
   * @param {number} [scale=1] - The scale of the joint.
   */
  constructor(
    link,
    shoulderWidth,
    isShoulderRight,
    length1,
    length2,
    constrains,
    returnSpeed = 2,
    isForwardBend = true,
    scale = 1
  ) {
    this._scale = Math.abs(scale);

    this.link = link;
    this.shoulderWidth = shoulderWidth;
    this.isShoulderRight = isShoulderRight;
    this.isForwardBend = isForwardBend;

    this.anchorAngle = constrains.anchorAngle;
    this.anchorDistance = constrains.anchorDistance;
    this.lengthes = [length1, length2];

    this.joints = [this.evalConnPoint(), Vector2D.Zero, Vector2D.Zero];
    this.joints[2] = this.evalTargetPoint();
    const intersPoints = getIntercectionPoint(
      this.joints[0],
      this.joints[2],
      this.lengthes[0],
      this.lengthes[1]
    );
    this.joints[1] =
      intersPoints[this.isForwardBend ^ this.isShoulderRight ? 1 : 0];
    this.sticked = true;

    this.targetPoint = this.evalTargetPoint();

    this.maxDifference = constrains.maxDifference;
    this.returnSpeed = returnSpeed;

    this.update();
  }

  /**
   * Calculates the connection point of the joint.
   * @returns {Vector2D} - The calculated connection point.
   */
  evalConnPoint() {
    const angle =
      this.link.directionAngle +
      (Math.PI / 2) * (this.isShoulderRight ? -1 : 1);

    const radius = this.shoulderWidth * this.scale;
    return Vector2D.addPolar(this.link.pos, radius, angle);
  }

  /**
   * Calculates the joint point based on intersection of the segments.
   * @returns {Vector2D} - The calculated joint point.
   */
  evalJointPoint() {
    const intersectionPoints = getIntercectionPoint(
      this.joints[0],
      this.joints[2],
      this.lengthes[0] * this.scale,
      this.lengthes[1] * this.scale
    );
    if (intersectionPoints.length > 0)
      return intersectionPoints[this.isForwardBend ^ this.isShoulderRight];

    const t = this.lengthes[0] / (this.lengthes[0] + this.lengthes[1]);

    const x = this.joints[0].x + t * (this.joints[2].x - this.joints[0].x);
    const y = this.joints[0].y + t * (this.joints[2].y - this.joints[0].y);

    return new Vector2D(x, y);
  }

  /**
   * Calculates the target point for the joint based on the anchor angle and distance.
   * @returns {Vector2D} - The calculated target point.
   */
  evalTargetPoint() {
    const angle =
      this.link.directionAngle +
      this.anchorAngle * (this.isShoulderRight ? -1 : 1);
    const radius = this.anchorDistance * this.scale;
    return Vector2D.addPolar(this.joints[0], radius, angle);
  }

  /**
   * Updates the joint's positions and states.
   */
  update() {
    this.targetPoint = this.evalTargetPoint();

    const dist = this.joints[2].distance(this.targetPoint);
    if (dist > this.maxDifference * this.scale) {
      this.sticked = false;
    }

    const newJoint0 = this.evalConnPoint();
    const distTraveled = this.joints[0].distance(newJoint0);

    this.joints[0] = newJoint0;
    if (!this.sticked) {
      const availableDistance = distTraveled * this.returnSpeed;
      const target = this.targetPoint;
      const current = this.joints[2];

      const distToTarget = current.distance(target);
      const lengthSum = (this.lengthes[0] + this.lengthes[1]) * this.scale;

      if (distToTarget <= availableDistance) {
        this.joints[2] = Vector2D.fromVec2D(target);
        this.sticked = true;
      } else {
        const ratio =
          (distToTarget < lengthSum * 1.5
            ? availableDistance
            : distToTarget - lengthSum) / distToTarget;

        this.joints[2] = new Vector2D(
          current.x + ratio * (target.x - current.x),
          current.y + ratio * (target.y - current.y)
        );
      }
    }
    this.joints[1] = this.evalJointPoint();
  }

  set scale(scale) {
    this._scale = Math.abs(scale);
  }
  get scale() {
    return this._scale;
  }
}

/**
 * Represents a Lizard with a segmented body and legs, extending the BodyBase class.
 * @class
 * @extends BodyBase
 */
class Lizard extends BodyBase {
  /**
   * Creates an instance of Lizard.
   * @param {Vector2D} [basisPosition=Vector2D.Zero] - The initial position of the lizard.
   * @param {Object} [style={}] - Style options for the lizard.
   * @param {string} [style.outline="white"] - The color of the lizard's outline.
   * @param {number} [style.outlineWidth=2] - The width of the lizard's outline.
   * @param {string} [style.fill="random"] - The fill color of the lizard.
   * @param {string} [style.eyesColor="black"] - The color of the lizard's eyes.
   * @param {number} [scale=1] - The scale factor for the lizard's size.
   * @param {boolean} [isLowRes=true] - Indicates if a low-resolution model should be used.
   */
  constructor(
    basisPosition = Vector2D.Zero,
    style = {
      outline: "white",
      outlineWidth: 2,
      fill: "random",
      eyesColor: "black",
    },
    scale,
    isLowRes = true
  ) {
    const radiusArray = isLowRes
      ? [6.5, 13, 9, 15.75, 16.5, 16, 14.5, 11, 6, 3.5, 2.25, 2, 2]
      : [
          2, 11, 13, 13, 10, 13, 15.5, 16, 16.5, 16.5, 16, 16, 15, 14, 12, 10,
          7, 5, 4, 3, 2.5, 2, 2, 2, 2, 2,
        ];
    style.legSize = 6;
    const dist = isLowRes ? 16 : 8;
    const ang = isLowRes ? 32 : 16;
    const head = isLowRes ? 5 : 2;
    super(
      radiusArray,
      dist,
      ang,
      basisPosition,
      head,
      5,
      140,
      2.5,
      13,
      style,
      scale,
      false
    );

    super.update(basisPosition);
    const constrUp = {
      maxDifference: 30,
      anchorDistance: 25,
      anchorAngle: 2.4,
      hipAngleRange: [0, 180], //TODO: implement? maybe later
    };
    const constrDown = {
      maxDifference: 30,
      anchorDistance: 25,
      anchorAngle: 2.1,
      hipAngleRange: [0, 180], //TODO: implement? maybe later
    };
    const legLinks = isLowRes ? [3, 7] : [6, 14];
    const linkUp = this.chainLinks[legLinks[0]];
    const linkDown = this.chainLinks[legLinks[1]];

    this.legs = [
      new Leg3Joint(linkUp, 8, false, 20, 20, constrUp, 2.3, false, scale),
      new Leg3Joint(linkUp, 8, true, 20, 20, constrUp, 2.3, false, scale),
      new Leg3Joint(linkDown, 8, false, 20, 20, constrDown, 2.3, true, scale),
      new Leg3Joint(linkDown, 8, true, 20, 20, constrDown, 2.3, true, scale),
    ];
    this.update(basisPosition);
  }

  /**
   * Updates the lizard's position and the state of its legs.
   * @param {Vector2D} pos - The new position of the lizard.
   */
  update(pos) {
    super.update(pos);
    this.legs.forEach((leg) => leg.update());
  }

  /**
   * Displays the skeleton of the lizard including the legs.
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context to draw on.
   */
  displaySkeleton(ctx) {
    super.displaySkeleton(ctx);

    this.legs.forEach((leg) => {
      const joints = leg.joints;
      const targetPoint = leg.targetPoint;

      ctx.beginPath();
      ctx.moveTo(joints[0].x, joints[0].y);
      ctx.setLineDash([5, 5]);

      ctx.lineTo(targetPoint.x, targetPoint.y);
      ctx.strokeStyle = "lightgrey";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.closePath();
      this.drawX(ctx, targetPoint, 10);
      ctx.setLineDash([]);

      ctx.beginPath();
      ctx.moveTo(joints[0].x, joints[0].y);
      for (let i = 1; i < joints.length; i++) {
        ctx.lineTo(joints[i].x, joints[i].y);
      }
      ctx.strokeStyle = "white";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.closePath();

      const colors = ["green", "LimeGreen", "GreenYellow "];
      joints.forEach((point, index) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 2.6, 0, 2 * Math.PI);
        ctx.fillStyle = colors[index];
        ctx.fill();
        ctx.closePath();
      });
    });
  }

  /**
   * Displays the lizard with its legs.
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context to draw on.
   */
  display(ctx) {
    this.legs.forEach((leg) => {
      leg.joints.forEach((point, i) => {
        ctx.beginPath();
        ctx.arc(
          point.x,
          point.y,
          (i < leg.joints.length / 2
            ? this.style.legSize
            : this.style.legSize) * this.scale,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = this.style.outline;
        ctx.fill();
        ctx.closePath();
      });

      for (let i = 1; i < leg.joints.length; i++) {
        ctx.beginPath();
        ctx.moveTo(leg.joints[i - 1].x, leg.joints[i - 1].y);
        ctx.lineTo(leg.joints[i].x, leg.joints[i].y);
        ctx.strokeStyle = this.style.outline; // Set the outline color
        ctx.lineWidth =
          i < leg.joints.length / 2
            ? this.style.legSize * this.scale * 2
            : this.style.legSize * this.scale * 2;
        ctx.stroke();
        ctx.closePath();
      }

      leg.joints.forEach((point, i) => {
        ctx.beginPath();
        ctx.arc(
          point.x,
          point.y,
          Math.max(
            0,
            (i < leg.joints.length / 2
              ? this.style.legSize
              : this.style.legSize) *
              this.scale -
              this.style.outlineWidth
          ),
          0,
          Math.PI * 2
        );
        ctx.fillStyle = this.style.fill;
        ctx.fill();
        ctx.closePath();
      });

      for (let i = 1; i < leg.joints.length; i++) {
        ctx.beginPath();
        ctx.moveTo(leg.joints[i - 1].x, leg.joints[i - 1].y);
        ctx.lineTo(leg.joints[i].x, leg.joints[i].y);
        ctx.strokeStyle = this.style.fill; // Set the outline color
        ctx.lineWidth = Math.max(
          0,
          (i < leg.joints.length / 2
            ? this.style.legSize * this.scale - this.style.outlineWidth
            : this.style.legSize * this.scale - this.style.outlineWidth) * 2
        );
        ctx.stroke();
        ctx.closePath();
      }
    });

    super.display(ctx);
  }

  /**
   * Initializes the PIXI graphics for lizard.
   */
  initPixiGrafics() {
    super.initPixiGrafics();

    this.graficElements.legs = [];
    this.legs.forEach((leg) => {
      const legObj = {};
      const legCont = new PIXI.Container();

      const line = new PIXI.Graphics();
      line.moveTo(leg.joints[0].x, leg.joints[0].y);
      line.lineTo(leg.joints[1].x, leg.joints[1].y);
      line.lineTo(leg.joints[2].x, leg.joints[2].y);
      if (this.style.outlineWidth > 0) {
        line.stroke({
          width:
            (this.style.legSize * 2 + this.style.outlineWidth * 2) * this.scale,
          color: this.style.outline,
          cap: "round",
          join: "round",
        });
      }

      legCont.addChild(line);
      legObj.outline = line;

      const line2 = new PIXI.Graphics();
      line2.moveTo(leg.joints[0].x, leg.joints[0].y);
      line2.lineTo(leg.joints[1].x, leg.joints[1].y);
      line2.lineTo(leg.joints[2].x, leg.joints[2].y);
      line2.stroke({
        width: this.style.legSize * 2 * this.scale,
        color: this.style.fill,
        cap: "round",
        join: "round",
      });
      legCont.addChild(line2);
      legObj.fill = line2;

      this.graficElements.legs.push(legObj);
      this.graphicContainer.addChildAt(legCont, 0);
    });
  }

  /**
   * Updates the PIXI graphics for the lizard.
   */
  updatePixiGrafics() {
    super.updatePixiGrafics();

    this.legs.forEach((leg, index) => {
      const line = this.graficElements.legs[index].outline;
      const line2 = this.graficElements.legs[index].fill;

      if (this.style.outlineWidth > 0) {
        line.visible = true;
        line.clear();
        line.moveTo(leg.joints[0].x, leg.joints[0].y);
        line.lineTo(leg.joints[1].x, leg.joints[1].y);
        line.lineTo(leg.joints[2].x, leg.joints[2].y);
        line.stroke({
          width:
            (this.style.legSize * 2 + this.style.outlineWidth * 2) * this.scale,
          color: this.style.outline,
          cap: "round",
          join: "round",
        });
      } else {
        line.visible = false;
      }

      line2.clear();
      line2.moveTo(leg.joints[0].x, leg.joints[0].y);
      line2.lineTo(leg.joints[1].x, leg.joints[1].y);
      line2.lineTo(leg.joints[2].x, leg.joints[2].y);
      line2.stroke({
        width: this.style.legSize * 2 * this.scale,
        color: this.style.fill,
        cap: "round",
        join: "round",
      });
    });
  }

  /**
   * Draws an "X" shape at a specified location.
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context to draw on.
   * @param {Vector2D} midPoint - The position of the center of the "X".
   * @param {number} size - The size of the "X".
   * @param {Object} [style={}] - Style options for the "X".
   * @param {number} [style.width=2] - The width of the lines in the "X".
   * @param {string} [style.color="lightgrey"] - The color of the lines in the "X".
   */
  drawX(ctx, midPoint, size, style = { width: 2, color: "lightgrey" }) {
    const halfSize = size / 2;

    const point1 = { x: midPoint.x - halfSize, y: midPoint.y - halfSize };
    const point2 = { x: midPoint.x + halfSize, y: midPoint.y + halfSize };
    const point3 = { x: midPoint.x - halfSize, y: midPoint.y + halfSize };
    const point4 = { x: midPoint.x + halfSize, y: midPoint.y - halfSize };

    ctx.beginPath();
    ctx.moveTo(point1.x, point1.y);
    ctx.lineTo(point2.x, point2.y);
    ctx.stroke();

    ctx.lineWidth = style.width;
    ctx.strokeStyle = style.color;
    ctx.beginPath();
    ctx.moveTo(point3.x, point3.y);
    ctx.lineTo(point4.x, point4.y);
    ctx.stroke();
  }

  set scale(scale) {
    this._scale = Math.abs(scale);
    this.legs.forEach((leg) => (leg.scale = scale));
  }

  get scale() {
    return this._scale;
  }
}

/**
 * Enum-like object for specifying animal types.
 * @readonly
 * @enum {string}
 */
const AnimalType = Object.freeze({
  LIZARD: "lizard",
  SNAKE: "snake",
  FISH: "fish",
  UNDEFINED: "undefined",
});

export { BodyBase, Snake, Lizard, Fish, AnimalType };
