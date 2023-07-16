import { z } from "zod";
import { DirectionDefinition, Route, RouteStop } from "./line-route";

/** The simplest type of line route. */
export class LinearRoute extends Route {
  constructor(
    /** Direction details to use for stops in the provided order. */
    readonly forward: DirectionDefinition,
    /** Direction details to use for stops in the reverse order. */
    readonly reverse: DirectionDefinition,
    /** Array of stops this line stops at or travels via. */
    readonly stops: RouteStop[]
  ) {
    super("linear");
    this.forward = forward;
    this.reverse = reverse;
    this.stops = stops;
  }

  static readonly linearJson = z.object({
    type: z.literal("linear"),
    forward: DirectionDefinition.json,
    reverse: DirectionDefinition.json,
    stops: RouteStop.json.array()
  });
  static readonly jsonTransform = (x: z.infer<typeof LinearRoute.linearJson>) =>
    new LinearRoute(x.forward, x.reverse, x.stops);

  toJSON(): z.input<typeof LinearRoute.linearJson> {
    return {
      type: "linear",
      forward: this.forward,
      reverse: this.reverse,
      stops: this.stops.map(s => s.toJSON())
    };
  }
}