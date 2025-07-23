import { Event, EventParams, EventParamsImpl } from './events';

// Event Handler Context interface
export interface HandlerContext {
  event: Event;
  getEventParams(): EventParams;
}

// Pure Handler Context - for deterministic state indexing
export interface PureHandlerContext extends HandlerContext {
  // Repository client for database operations within transactions
  repoClient: any; // Will be typed properly when repo integration is complete
}

// Side Effect Handler Context - for non-deterministic operations
export interface SideEffectHandlerContext<SharedState = any> extends HandlerContext {
  repoClient: any;
  getSharedState(): Promise<SharedState>;
}

// Pure Handler interface for deterministic event processing
export interface PureHandler {
  // Human-readable ABI of the event being handled
  // Example: "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
  abi(): string;

  // Handle the event deterministically
  handleEvent(context: PureHandlerContext): Promise<void>;
}

// Side Effect Handler interface for non-deterministic operations
export interface SideEffectHandler<SharedState = any> {
  abi(): string;
  handleEvent(context: SideEffectHandlerContext<SharedState>): Promise<void>;
}

// Event ABI type
export type EventAbi = string;

// Implementation of PureHandlerContext
export class PureHandlerContextImpl implements PureHandlerContext {
  constructor(
    public event: Event,
    public repoClient: any
  ) {}

  getEventParams(): EventParams {
    return new EventParamsImpl(this.event.parameters);
  }
}

// Implementation of SideEffectHandlerContext
export class SideEffectHandlerContextImpl<SharedState = any>
  implements SideEffectHandlerContext<SharedState>
{
  constructor(
    public event: Event,
    public repoClient: any,
    private sharedState?: SharedState
  ) {}

  getEventParams(): EventParams {
    return new EventParamsImpl(this.event.parameters);
  }

  async getSharedState(): Promise<SharedState> {
    if (this.sharedState === undefined) {
      throw new Error('No shared state provided to SideEffectHandler');
    }
    return this.sharedState;
  }
}

// Helper functions to create contexts
export function createPureHandlerContext(event: Event, repoClient: any): PureHandlerContext {
  return new PureHandlerContextImpl(event, repoClient);
}

export function createSideEffectHandlerContext<SharedState = any>(
  event: Event,
  repoClient: any,
  sharedState?: SharedState
): SideEffectHandlerContext<SharedState> {
  return new SideEffectHandlerContextImpl(event, repoClient, sharedState);
}
