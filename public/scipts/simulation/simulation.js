import { AnimalType, BodyBase, Fish, Lizard, Snake } from "./animals.js";
import { getMousePos, Vector2D } from "./utils.js";

/**
 * Represents the parameters for a simulation, including forces and constraints.
 * @class
 */
class SimulationParams {
  /**
   * Creates an instance of SimulationParams.
   * @param {number} [perceptionRadius=50] - The radius within which entities perceive each other.
   * @param {number} [alignmentImpact=1] - The impact factor for alignment behavior.
   * @param {number} [cohesionImpact=0.4] - The impact factor for cohesion behavior.
   * @param {number} [avoidanceImpact=1] - The impact factor for avoidance behavior.
   * @param {number} [mouseForceRadius=150] - The radius within which the mouse exerts a force.
   * @param {number} [mouseForceScale=100] - The scale of the force applied by the mouse.
   * @param {number} [maxVelocity=8] - The maximum velocity of entities.
   * @param {number} [maxAcceleration=1] - The maximum acceleration of entities.
   */
  constructor(
    perceptionRadius = 50,
    alignmentImpact = 1,
    cohesionImpact = 0.4,
    avoidanceImpact = 1,
    mouseForceRadius = 150,
    mouseForceScale = 100,
    maxVelocity = 8,
    maxAcceleration = 1
  ) {
    this.perceptionRadius = perceptionRadius;
    this.alignmentImpact = alignmentImpact;
    this.cohesionImpact = cohesionImpact;
    this.avoidanceImpact = avoidanceImpact;
    this.mouseForceRadius = mouseForceRadius;
    this.mouseForceScale = mouseForceScale;
    this.maxVelocity = maxVelocity;
    this.maxAcceleration = maxAcceleration;
  }

  /**
   * Sets the impact factors for alignment, cohesion, and avoidance behaviors.
   * @param {number} alignment - The new impact factor for alignment behavior.
   * @param {number} cohesion - The new impact factor for cohesion behavior.
   * @param {number} avoidance - The new impact factor for avoidance behavior.
   */
  setImpactForces(alignment, cohesion, avoidance) {
    this.alignmentImpact = alignment;
    this.cohesionImpact = cohesion;
    this.avoidanceImpact = avoidance;
  }
}

/**
 * Enum-like object for specifying position init types for boids.
 * @readonly
 * @enum {string}
 */
const PositionType = Object.freeze({
  RANDOM: "random",
  SIDES: "sides",
  ZERO: "zero",
});

/**
 * Represents an individual boid in the simulation.
 * @class
 */
class Boid {
  /**
   * Creates an instance of Boid.
   * @param {number} width - The width of the simulation area.
   * @param {number} height - The height of the simulation area.
   * @param {number} [left=0] - The x-coordinate of the simulation area's left boundary.
   * @param {number} [top=0] - The y-coordinate of the simulation area's top boundary.
   * @param {Animal} [animal=undefined] - An optional animal object to be associated with this boid.
   * @param {PositionType} [initialPos=PositionType.RANDOM] - Initial position to set. If undefined, automatically set to be random.
   */
  constructor(
    width,
    height,
    left = 0,
    top = 0,
    animal = undefined,
    initialPos = PositionType.RANDOM
  ) {
    let x = 0;
    let y = 0;
    switch (initialPos) {
      case PositionType.ZERO:
        x = Math.random();
        y = Math.random();
        break;
      case PositionType.SIDES:
        if (Math.random() > 0.5) {
          x = left + Math.random() * width;
          y = Math.random() > 0.5 ? top : height;
        } else {
          x = Math.random() > 0.5 ? left : width;
          y = top + Math.random() * height;
        }
        break;
      case PositionType.RANDOM:
      default:
        x = left + Math.random() * width;
        y = top + Math.random() * height;
        break;
    }
    this.position = new Vector2D(x, y);

    this.velocity = Vector2D.random(0.75 + Math.random());

    this.acceleration = Vector2D.Zero;

    this.animal = animal;
  }

  /**
   * Displays the boid with a simple representation if no animal is defined.
   * @param {CanvasRenderingContext2D} ctx - The 2D drawing context of the canvas.
   */
  displaySimple(ctx) {
    if (this.animal) this.animal.displaySkeleton(ctx);

    const size = 20;
    const vecSize = 40;
    const angle = this.velocity.angle;

    const pVec = Vector2D.addPolar(this.position, vecSize, angle);
    const p1 = Vector2D.addPolar(this.position, size, angle);
    const p2 = Vector2D.addPolar(this.position, size, angle + Math.PI / 1.3);
    const p3 = Vector2D.addPolar(this.position, size, angle - Math.PI / 1.3);

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.closePath();
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#8b99b0";
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(this.position.x, this.position.y);
    ctx.lineTo(pVec.x, pVec.y);
    ctx.closePath();
    ctx.strokeStyle = "lime";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = "red";
    ctx.fill();
    ctx.closePath();
  }

  /**
   * Displays the boid, using its animal representation if defined.
   * @param {CanvasRenderingContext2D} ctx - The 2D drawing context of the canvas.
   */
  displayAnimal(ctx) {
    if (typeof this.animal === "undefined") {
      this.displaySimple(ctx);
      return;
    }

    this.animal.display(ctx);
  }

  /**
   * Updates the boid's position and velocity based on its acceleration.
   * @param {number} deltaTime - The time elapsed since the last update.
   * @param {SimulationParams} params - The simulation parameters.
   */
  update(deltaTime, params) {
    if (!deltaTime) return;

    this.position.add(Vector2D.scale(this.velocity, deltaTime));
    this.velocity.add(this.acceleration);
    this.velocity.clampMag(params.maxVelocity);

    if (typeof this.animal !== "undefined") {
      this.animal.update(this.position);
      this.animal.update(this.position);
    }
  }

  /**
   * Wraps the boid's position around the simulation boundaries.
   * @param {Object} boundaries - The boundaries of the simulation area.
   * @param {number} boundaries.width - The width of the simulation area.
   * @param {number} boundaries.height - The height of the simulation area.
   * @param {number} boundaries.left - The x-coordinate of the simulation area's left boundary.
   * @param {number} boundaries.top - The y-coordinate of the simulation area's top boundary.
   */
  edges(boundaries) {
    if (this.position.x > boundaries.width + boundaries.left) {
      this.position.x = boundaries.left;
    } else if (this.position.x < boundaries.left) {
      this.position.x = boundaries.width + boundaries.left;
    }

    if (this.position.y > boundaries.height + boundaries.top) {
      this.position.y = boundaries.top;
    } else if (this.position.y < boundaries.top) {
      this.position.y = boundaries.height + boundaries.top;
    }
  }

  /**
   * Calculates the boid's acceleration based on flocking behavior.
   * @param {Boid[]} boids - The list of all boids in the simulation.
   * @param {SimulationParams} params - The simulation parameters.
   */
  flock(boids, params) {
    this.acceleration.set(0, 0);

    const alignment = this.align(boids, params);
    const cohesion = this.cohesion(boids, params);
    const avoidance = this.separate(boids, params);

    alignment.scale(params.alignmentImpact);
    cohesion.scale(params.cohesionImpact);
    avoidance.scale(params.avoidanceImpact);

    // Adds to our acceleration force the values above
    // since we have no mass in the sistem {Force = Acceleration}
    this.acceleration.add(alignment);
    this.acceleration.add(cohesion);
    this.acceleration.add(avoidance);
  }

  /**
   * Calculates the separation force to avoid crowding with other boids.
   * @param {Boid[]} boids - The list of all boids in the simulation.
   * @param {SimulationParams} params - The simulation parameters.
   * @returns {Vector2D} The separation force.
   */
  separate(boids, params) {
    let perceptionRadius = params.perceptionRadius;
    let totalBoids = 0;
    let avoidance = new Vector2D(0, 0);

    boids.forEach((boid) => {
      let d = this.position.distance(boid.position);

      if (d < perceptionRadius && boid != this) {
        let diff = Vector2D.sub(this.position, boid.position);
        diff.div(d);

        avoidance.add(diff);
        totalBoids++;
      }
    });

    if (totalBoids > 0) {
      avoidance.div(totalBoids);
      avoidance.magnitude = params.maxVelocity;
      avoidance.sub(this.velocity);
      avoidance.clampMag(params.maxAcceleration);
    }
    return avoidance;
  }

  /**
   * Calculates the alignment force to match the velocity of nearby boids.
   * @param {Boid[]} boids - The list of all boids in the simulation.
   * @param {SimulationParams} params - The simulation parameters.
   * @returns {Vector2D} The alignment force.
   */
  align(boids, params) {
    let perceptionRadius = params.perceptionRadius;
    let totalBoids = 0;
    let desiredForce = Vector2D.Zero;

    boids.forEach((boid) => {
      let d = this.position.distance(boid.position);

      if (d < perceptionRadius && boid != this) {
        desiredForce.add(boid.velocity);
        totalBoids++;
      }
    });

    if (totalBoids > 0) {
      desiredForce.div(totalBoids);
      desiredForce.magnitude = params.maxVelocity;
      desiredForce.sub(this.velocity);
      desiredForce.clampMag(params.maxAcceleration);
    }
    return desiredForce;
  }

  /**
   * Calculates the cohesion force to move towards the average position of nearby boids.
   * @param {Boid[]} boids - The list of all boids in the simulation.
   * @param {SimulationParams} params - The simulation parameters.
   * @returns {Vector2D} The cohesion force.
   */
  cohesion(boids, params) {
    let perceptionRadius = params.perceptionRadius;
    let totalBoids = 0;
    let steering = Vector2D.Zero;

    boids.forEach((boid) => {
      let d = this.position.distance(boid.position);

      if (d < perceptionRadius && boid != this) {
        steering.add(boid.position);
        totalBoids++;
      }
    });

    if (totalBoids > 0) {
      steering.div(totalBoids);
      steering.sub(this.position);
      steering.magnitude = params.maxVelocity;
      steering.sub(this.velocity);
      steering.clampMag(params.maxAcceleration);
    }
    return steering;
  }

  /**
   * Applies a force to the boid based on a point of origin, a scale factor, and an optional radius.
   *
   * @param {Vector2D} point - The point of origin from which the force is applied.
   * @param {number} [scale=1] - The scale of the force to be applied.
   * @param {number} [radius] - The optional radius within which the point of origin must be close enough for the force to be applied. If not provided, the force is applied regardless of distance.
   *
   * @description
   * The method calculates the vector of force as the difference between the boid's current position and the provided point. If the distance between the boid and the point is within the specified radius (if given), the method scales the force vector by the provided scale factor and applies it to the boid's acceleration.
   */
  applyForce(vec, scale = 1, radius = undefined) {
    const forceVec = Vector2D.sub(this.position, vec);
    if (typeof radius !== "undefined" && forceVec.magnitude > radius) return;
    forceVec.magnitude = (1 / forceVec.magnitude) * scale;
    this.acceleration.add(forceVec);
  }

  destroy() {
    this.animal.destroy();
  }
}

/**
 * Manages a collection of points, each associated with a creation time and a delay.
 * Handles the addition and removal of points based on their delay.
 */
class RipplesManager {
  /**
   * Creates an instance of RipplesManager.
   *
   * @param {number} [maxRipples=10] - The maximum number of ripples.
   * @param {number} [delay=600] - The delay after which a point is removed.
   * @param {number} [divisor=5] - The divisor used for ripple calculations.
   * @param {number} [threshold=10] - The threshold for ripple calculations.
   * @param {number[]} [startVars=[0, 40, 60]] - The initial radius delay for ripple calculations.
   */
  constructor(
    maxRipples = 10,
    delay = 600,
    divisor = 5,
    threshold = 10,
    startVars = [0, 40, 60]
  ) {
    /**
     * @type {Array<{ point: Vector2D, creationTime: number, delay: number }>}
     * @private
     */
    this.points = [];
    this.maxRipples = maxRipples;
    this.delay = delay;
    this.divisor = divisor;
    this.threshold = threshold;
    this.startVars = startVars;
  }

  /**
   * Adds a point to the manager with a specified delay.
   *
   * @param {Vector2D} point - The point to be added.
   */
  addPoint(point) {
    if (this.points.length >= this.maxRipples) return;

    const creationTime = Date.now();
    const arrInstance = {
      pos: point,
      creationTime: creationTime,
      delay: this.delay,
    };
    this.points.push(arrInstance);

    setTimeout(() => {
      this.removePoint(arrInstance);
    }, this.delay);
  }

  /**
   * Removes a point from the manager.
   *
   * @param {{ point: Vector2D, creationTime: number, delay: number }} arrInstance - The point object to be removed.
   */
  removePoint(arrInstance) {
    const index = this.points.indexOf(arrInstance);
    if (index > -1) {
      this.points.splice(index, 1);
    }
  }

  /**
   * Retrieves all points with their elapsed time and delay.
   *
   * @returns {Array<{ point: Vector2D, time: number, delay: number }>} An array of objects, each containing a point, the time elapsed since creation, and the delay.
   */
  getPointsWithTimes() {
    const currentTime = Date.now();
    return this.points.map((item) => {
      const timePassed = currentTime - item.creationTime;
      return { pos: item.pos, time: timePassed };
    });
  }

  /**
   * Retrieves all points without their associated times.
   *
   * @returns {Array<Vector2D>} An array of points.
   */
  getPoints() {
    return this.points.map((point) => point.pos);
  }
}

/**
 * Manages a simulation of boids (flock simulation) within specified boundaries and parameters.
 * Handles updating boid behaviors, displaying boids and ripple effects, and managing mouse interactions.
 */
class Simulation {
  /**
   * Callback for adding two numbers.
   *
   * @callback customAnimalCallback
   * @param {number} index - The index of the animal in the boids array.
   * @param {Object} style - The style object passed to the constructor.
   * @param {number} scale - The random scale value from the sizesRange.
   * @param {boolean} resolution - The lowRes flag passed to the constructor.
   * @returns {BodyBase} An instance of a class extending BodyBase. Must provide methods `update(pos)`, `display(ctx)` and `displaySkeleton(ctx)`.
   */

  /**
   * Creates an instance of Simulation.
   *
   * @param {number} numberOfBoids - The number of boids in the simulation.
   * @param {{ width: number, height: number, margin: number }} boundaries - The dimentions of simaluation area and margin to the border of area.
   * @param {SimulationParams} params - The parameters for boid behaviors.
   * @param {AnimalType} animalType - The type of animal for the boids. See {@link AnimalType}.
   * @param {{ fill: string, outline: string, outlineWidth: number, eyesColor: string }} [style={ fill: "random", outline: "white", outlineWidth: 1.5, eyesColor: "white" }] - The style settings for the animals. To make all animals have different color, set `fill: "random"`.
   * @param {[number, number]} [sizesRange=[1, 1]] - The range for the sizes of the animals.
   * @param {boolean} [lowRes=false] - Whether to use low resolution for the animal visuals.
   * @param {number} [maxRipples=10] - Defines maximum number of ripples on the screen.
   * @param {customAnimalCallback} [customAnimalCallback] - Optional callback function for creating custom animals. Being called if `animalType = AnimalType.UNDEFINED`
   */
  constructor(
    numberOfBoids,
    boundaries,
    params,
    style = {
      fill: "random",
      outline: "white",
      outlineWidth: 1.5,
      eyesColor: "white",
    },
    sizesRange = [1, 1],
    animalType,
    lowRes = false,
    spawnPlace = PositionType.SIDES,
    maxRipples = 10,
    customAnimalCallback = (index, style, scale, resolution) => {
      return new BodyBase();
    }
  ) {
    const maxBoids = numberOfBoids;
    this.flock = [];
    this.graphicContainers = [];
    this.graphicContainer = new PIXI.Container();
    this.boundaries = {
      width: boundaries.width + boundaries.margin * 2,
      height: boundaries.height + boundaries.margin * 2,
      left: -boundaries.margin,
      top: -boundaries.margin,
      margin: boundaries.margin,
    };
    this.params = params;

    this.style = JSON.parse(JSON.stringify(style));
    this.animalType = animalType;
    this.sizesRange = sizesRange;
    this.isLowRes = lowRes;
    this.spawnPlace = spawnPlace;
    this.customAnimalCB = customAnimalCallback;
    for (let i = 0; i < maxBoids; i++) {
      this.addAnimal(i);
    }
    this.mousePos = Vector2D.Zero;
    this.ripples = new RipplesManager(maxRipples);
    this.riplesContainer = new PIXI.Container();
    this.riplesObjects = [];
  }

  /**
   * Updates the simulation state, including boid behaviors and interactions with ripple points.
   *
   * @param {number} deltaTime - The time elapsed since the last update in milliseconds.
   */
  update(deltaTime) {
    const ripplePoints = this.ripples.getPoints();

    this.flock.forEach((boid) => {
      boid.edges(this.boundaries);
      boid.flock(this.flock, this.params);
      ripplePoints.forEach((point) => {
        boid.applyForce(
          point,
          this.params.mouseForceScale,
          this.params.mouseForceRadius
        );
      });
      boid.update(deltaTime, this.params);
    });
  }

  /**
   * Initializes the Pixi.js graphics for the simulation, including boid visuals and ripple effects.
   */
  initPixiGrafics() {
    this.flock.forEach((boid) => {
      boid.animal.initPixiGrafics();
    });

    const divisor = this.ripples.divisor;
    const threshold = this.ripples.threshold;
    const startVars = this.ripples.startVars;
    const delay = this.ripples.delay;
    const maxRipples = this.ripples.maxRipples;
    const maxRadius = threshold + delay / divisor;
    for (let i = 0; i < maxRipples; i++) {
      const circleContainer = new PIXI.Container();
      this.riplesContainer.addChild(circleContainer);
      const rplObj = {
        container: circleContainer,
        circles: [],
      };
      for (let j = 0; j < startVars.length; j++) {
        const c = new PIXI.Graphics();
        c.circle(0, 0, maxRadius);
        c.stroke({ width: 8, color: "white" });
        circleContainer.addChild(c);
        rplObj.circles.push(c);
      }
      this.riplesObjects.push(rplObj);
    }
  }

  /**
   * Updates the Pixi.js graphics for the ripple effects based on the current simulation state.
   */
  updatePixiRiples() {
    const divisor = this.ripples.divisor;
    const threshold = this.ripples.threshold;
    const startVars = this.ripples.startVars;
    const delay = this.ripples.delay;
    const maxRadius = threshold + delay / divisor;

    const simSize = this.ripples.points.length;
    const positions = this.ripples.getPointsWithTimes();
    for (let i = 0; i < this.riplesObjects.length; i++) {
      const rplObj = this.riplesObjects[i];
      // rplObj.container.visible = false;
      if (i >= simSize) {
        rplObj.container.visible = false;
      } else {
        const ripple = positions[i];

        rplObj.container.visible = true;
        rplObj.container.position.set(ripple.pos.x, ripple.pos.y);

        for (let j = 0; j < rplObj.circles.length; j++) {
          const ripleCrcl = rplObj.circles[j];
          const rplPoint = positions[i];

          const timeToDeletion = rplPoint.time / delay;
          const radius = threshold + rplPoint.time / divisor;

          const curRadius = radius - startVars[j];
          if (curRadius < 0) {
            ripleCrcl.alpha = 0.0;
            continue;
          }
          ripleCrcl.scale = curRadius / maxRadius;

          const alpha =
            Math.pow(1 - curRadius / maxRadius, 2) *
            Math.pow(1 - timeToDeletion, 0.2);
          ripleCrcl.alpha = alpha;
        }
      }
    }
  }

  /**
   * Updates the Pixi.js graphics for the boid visuals based on the current simulation state.
   */
  updatePixiGrafics() {
    this.flock.forEach((boid, index) => {
      boid.animal.updatePixiGrafics();
    });
  }

  /**
   * Attaches the Pixi.js graphics containers for boids and ripples to the given stage.
   *
   * @param {PIXI.Container} stage - The Pixi.js stage to which the graphics containers will be attached.
   */
  attachPixiContainers(stage) {
    this.graphicContainers.forEach((c) => {
      this.graphicContainer.addChild(c);
    });

    stage.addChild(this.graphicContainer);
    stage.addChild(this.riplesContainer);
  }

  /**
   * Displays the boids using their animal visuals.
   *
   * @param {CanvasRenderingContext2D} ctx - The 2D rendering context of the canvas.
   */
  displayAnimal(ctx) {
    this.flock.forEach((boid) => {
      boid.displayAnimal(ctx);
    });
  }

  /**
   * Displays the boids with simple shapes and the ripple circles.
   *
   * @param {CanvasRenderingContext2D} ctx - The 2D rendering context of the canvas.
   */
  displaySimple(ctx) {
    this.flock.forEach((boid) => {
      boid.displaySimple(ctx);
    });

    ctx.strokeStyle = "yellow";
    ctx.lineWidth = 2;
    this.ripples.getPointsWithTimes().forEach((point) => {
      ctx.beginPath();
      ctx.arc(
        point.point.x,
        point.point.y,
        this.params.mouseForceRadius,
        0,
        Math.PI * 2
      );
      ctx.stroke();
      ctx.closePath();
    });
  }

  /**
   * Displays the ripple effects based on the points' elapsed time and delay.
   *
   * @param {CanvasRenderingContext2D} ctx - The 2D rendering context of the canvas.
   */
  displayRipples(ctx) {
    ctx.lineWidth = 3;
    const divisor = this.ripples.divisor;
    const threshold = this.ripples.threshold;
    const startVars = this.ripples.startVars;
    const delay = this.ripples.delay;
    const maxRadius = threshold + delay / divisor;

    this.ripples.getPointsWithTimes().forEach((point) => {
      if (point.time < delay) {
        const timeToDeletion = point.time / delay;
        const radius = threshold + point.time / divisor;

        for (let i = 0; i < startVars.length; i++) {
          const curRadius = radius - startVars[i];
          if (curRadius < 0) continue;
          const color =
            Math.pow(1 - curRadius / maxRadius, 2) *
            Math.pow(1 - timeToDeletion, 0.2);
          ctx.strokeStyle = `rgba(255, 255, 255, ${color})`;
          ctx.beginPath();
          ctx.arc(point.pos.x, point.pos.y, curRadius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.closePath();
        }
      }
    });
  }

  /**
   * Adds a new ripple point at the current mouse position.
   */
  addPoint() {
    this.ripples.addPoint(Vector2D.fromVec2D(this.mousePos));
  }

  /**
   * Sets the current mouse position.
   *
   * @param {Vector2D} vec - The new mouse position.
   */
  setMousePos(vec) {
    this.mousePos.set(vec.x, vec.y);
  }

  /**
   * Sets the new bounds.
   *
   * @param {number} newWidth - The new width.
   * @param {number} newHeight - The new height.
   * @param {number} [newMargin=undefined] - The new margin. If left to be `undefined`, sets current margin.
   */
  setBounds(newWidth, newHeight, newMargin = undefined) {
    newWidth = Math.max(1, newMargin);
    newHeight = Math.max(1, newHeight);
    const margin =
      typeof newMargin !== "undefined" ? newMargin : this.boundaries.margin;
    this.boundaries = {
      width: newWidth + margin * 2,
      height: newHeight + margin * 2,
      left: -margin,
      top: -margin,
      margin: margin,
    };
  }

  /**
   * Sets style for the creatures
   * @param {{ fill: string, outline: string, outlineWidth: number, eyesColor: string }} [style={ fill: "#01111c", finFill: "#01111c", outline: "#04080a", outlineWidth: 1.5, eyesColor: "#04080a" }] - The style settings for the animals. To make all animals have different color, set `fill: "random"`.
   */
  setStyle(style) {
    this.flock.forEach((boid) => {
      boid.animal.setStyle(JSON.parse(JSON.stringify(style)));
    });
  }

  addAnimal(i = 0) {
    const scale =
      this.sizesRange[0] +
      Math.random() * (this.sizesRange[1] - this.sizesRange[0]);
    const uniqueStyle = JSON.parse(JSON.stringify(this.style));

    let animal;
    //TODO: weird "snake" visuals and movement, I do not recommend to set to "snake" option
    switch (this.animalType) {
      case AnimalType.UNDEFINED:
        animal = this.customAnimalCallback(
          i,
          uniqueStyle,
          scale,
          this.isLowRes
        );
        break;
      case AnimalType.LIZARD:
        animal = new Lizard(Vector2D.Zero, uniqueStyle, scale, this.isLowRes);
        break;
      case AnimalType.SNAKE:
        animal = new Snake(Vector2D.Zero, uniqueStyle, scale);
        break;
      case AnimalType.FISH:
      default:
        animal = new Fish(Vector2D.Zero, uniqueStyle, scale, this.isLowRes);
        break;
    }
    this.graphicContainers.push(animal.graphicContainer);
    this.flock.push(
      new Boid(
        this.boundaries.width,
        this.boundaries.height,
        this.boundaries.left,
        this.boundaries.top,
        animal,
        this.spawnPlace
      )
    );
    return animal;
  }

  updateBoidAmount(amount) {
    const curAmount = this.flock.length;
    if (amount < curAmount) {
      const amountToDelete = curAmount - amount;
      const itemsToDelete = this.flock.slice(-amountToDelete);
      itemsToDelete.forEach((boid) => boid.destroy());
      this.flock = this.flock.slice(0, -amountToDelete);
      this.graphicContainers = this.graphicContainers.slice(0, -amountToDelete);
    } else {
      const amountToAdd = amount - curAmount;
      for (let i = 0; i < amountToAdd; i++) {
        const animal = this.addAnimal(amount + i);
        animal.initPixiGrafics();

        this.graphicContainer.addChild(animal.graphicContainer);
      }
    }
  }

  replaceAnimalType(newAnimalType) {
    const animalAmount = this.flock.length;
    this.updateBoidAmount(0);
    this.animalType = newAnimalType;
    this.updateBoidAmount(animalAmount);
  }
}

/**
 * Enum-like object for specifying renderer types.
 * @readonly
 * @enum {string}
 */
const RendererType = Object.freeze({
  CANVAS: "canvas",
  PIXI: "pixi",
});

/**
 * Wrapper class for managing and rendering a simulation on a given canvas using either PIXI or Canvas rendering.
 */
class SimulationWrapper {
  /**
   * Creates an instance of SimulationWrapper.
   *
   * @param {HTMLCanvasElement} canvas - The canvas element on which the simulation will be rendered.
   * @param {Simulation} [simulation=undefined] - The simulation instance to be managed.
   * @param {RendererType} [renderer=RendererType.PIXI] - The type of renderer to use (PIXI or CANVAS). PIXI is preffered.
   * @param {string} [background="#082a68"] - The background color of the canvas.
   * @param {number} [precalculateBy=100] - The number of initial simulation steps to precalculate.
   */
  constructor(
    canvas,
    background = "#061f30",
    simulation = undefined,
    renderer = RendererType.PIXI,
    precalculateBy = 0
  ) {
    this.renderer = renderer;
    this.isTickerActive = true;

    if (!simulation) {
      this.simulation = this.defaultSimulation(canvas);
    } else {
      this.simulation = simulation;
    }
    this.canvas = canvas;
    this.background = background;
    this.canvas.style.background = this.background;
    this.mousePos = new Vector2D(0, 0);
    this.isInteractable = false;
    this._mousemoveListener = (event) => {
      const pos = getMousePos(this.canvas, event);
      this.mousePos.set(pos.x, pos.y);
      this.simulation.setMousePos(pos);
    };
    this._mousedownListener = (event) => {
      this.simulation.addPoint();
    };
    this.lastTime = performance.now();

    for (let i = 0; i < Math.min(precalculateBy, 1000); i++) {
      this.simulation.update(1);
    }
    switch (this.renderer) {
      case RendererType.CANVAS:
        this.ctx = canvas.getContext("2d");
        this.initCanvas();
        break;
      case RendererType.PIXI:
      default:
        this.app = new PIXI.Application();
        this.initPixi();
        break;
    }
  }

  /**
   * Creates simulation object with default parameters.
   * @param {HTMLCanvasElement} canvas - The canvas element on which the simulation will be rendered.
   */
  defaultSimulation(canvas) {
    // Define boundaries for the simulation area
    const bounds = {
      width: canvas.width,
      height: canvas.height,
      margin: 200,
    };

    // Create simulation parameters with default values
    const params = new SimulationParams();
    // params.perceptionRadius = 100;
    params.setImpactForces(1, 0.8, 1.2);
    params.maxVelocity = this.renderer == RendererType.PIXI ? 3 : 8;
    params.maxAcceleration = RendererType.PIXI ? 0.3 : 1;

    const style = {
      fill: "#01111c", //"#0b2b42",
      // fill: "random",
      finFill: "#01111c", //"#0b2b42",
      outline: "#04080a", //"#0a2030",
      outlineWidth: 1.5,
      eyesColor: "#04080a", //"#0a2030",
    };

    // Initialize the simulation with, the defined bounds, parameters, and styles
    const simulation = new Simulation(
      150,
      bounds,
      params,
      style,
      [0.5, 1],
      AnimalType.FISH,
      true,
      PositionType.SIDES,
      20
    );
    return simulation;
  }

  /**
   * Add or remove event listeners for mouse movements and clicks on the canvas.
   * @param {boolean} [isToggled=true] To add or to remove listeners.
   */
  toggleInteractions(isToggled = true) {
    if (isToggled === this.isInteractable) return;
    this.isInteractable = isToggled;
    if (this.isInteractable) {
      this.canvas.addEventListener("mousemove", this._mousemoveListener);
      this.canvas.addEventListener("mousedown", this._mousedownListener);
    } else {
      console.log("called");
      this.canvas.removeEventListener("mousemove", this._mousemoveListener);
      this.canvas.removeEventListener("mousedown", this._mousedownListener);
    }
  }

  /**
   * Initializes the PIXI renderer and attaches the PIXI containers.
   */
  async initPixi() {
    await this.app.init({
      canvas: this.canvas,
      width: this.canvas.width,
      height: this.canvas.height,
      preference: "webgl",
      background: this.background,
      antialias: true,
    });

    this.simulation.initPixiGrafics();
    this.simulation.attachPixiContainers(this.app.stage);
    this.app.renderer.events.autoPreventDefault = false;
    this.app.renderer.view.canvas.style["touch-action"] = "auto";

    this.app.ticker.add((delta) => {
      if (this.isTickerActive) {
        this.simulation.update(delta.deltaTime);
        this.simulation.updatePixiGrafics();
        this.simulation.updatePixiRiples();
      }
    });
  }

  /**
   * Animation loop for the canvas renderer.
   *
   * @param {DOMHighResTimeStamp} timestamp - The current time for the animation frame.
   */
  animate = (timestamp) => {
    const deltaTime = (timestamp - this.lastTime) / 30;
    this.lastTime = timestamp;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.simulation.update(deltaTime);
    this.simulation.displayAnimal(this.ctx);
    this.simulation.displayRipples(this.ctx);
    // this.simulation.displaySimple(this.ctx);

    requestAnimationFrame(this.animate);
  };

  /**
   * Initializes the canvas renderer and starts the animation loop.
   */
  initCanvas() {
    requestAnimationFrame(this.animate);
  }

  /**
   * Resizes resolution of the canvas to the specified size. Simulation bounds are also adjusted.
   * @param {number} width - Width to resize canvas to.
   * @param {number} height - Height to resize canvas to.
   */
  resize(width = 1600, height = 600) {
    width = Math.max(width, 1);
    height = Math.max(height, 1);
    setTimeout(() => {
      this.simulation.setBounds(width, height);
      switch (this.renderer) {
        case RendererType.CANVAS:
          this.canvas.width = width;
          this.canvas.height = height;
          break;
        case RendererType.PIXI:
        default:
          this.app.renderer.resize(width, height);
          break;
      }
    });
  }

  /**
   * @param {{ fill: string, outline: string, outlineWidth: number, eyesColor: string }} [style={ fill: "#01111c", finFill: "#01111c", outline: "#04080a", outlineWidth: 1.5, eyesColor: "#04080a" }] - The style settings for the animals. To make all animals have different color, set `fill: "random"`.
   * @param {string} [background="#061f30"] - Canvas background new color.
   */
  setBasicStyle(
    style = {
      fill: "#01111c",
      finFill: "#01111c",
      outline: "#04080a",
      outlineWidth: 1.5,
      eyesColor: "#04080a",
    },
    background = "#061f30"
  ) {
    this.background = background;
    this.canvas.style.background = this.background;

    if (this.renderer === RendererType.PIXI) {
      this.app.renderer.background._backgroundColor.value = this.background;
    }

    this.simulation.setStyle(style);
  }

  changeCreaturesAmount(amount) {
    if (amount < 0) return;
    this.isTickerActive = false;
    this.simulation.updateBoidAmount(amount);
    this.isTickerActive = true;
  }

  replaceAnimalType(newAnimalType) {
    this.simulation.replaceAnimalType(newAnimalType);
  }
}

export {
  Simulation,
  SimulationParams,
  SimulationWrapper,
  RendererType,
  PositionType,
};
