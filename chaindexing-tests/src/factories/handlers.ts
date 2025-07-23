import { PureHandler, SideEffectHandler, SideEffectHandlerContext } from '@chaindexing/core';

export class TransferTestHandler implements PureHandler {
  abi(): string {
    return 'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)';
  }

  async handleEvent(_context: any): Promise<void> {
    // Test handler - does nothing for now
    // In real tests, this would create/update state
    console.log('TransferTestHandler called');
  }
}

export class ApprovalForAllTestHandler implements PureHandler {
  abi(): string {
    return 'event ApprovalForAll(address indexed owner, address indexed operator, bool approved)';
  }

  async handleEvent(_context: any): Promise<void> {
    // Test handler - does nothing for now
    console.log('ApprovalForAllTestHandler called');
  }
}

// Test side effect handler
export interface TestAppState {
  notificationCount: number;
  lastProcessedEvent: string | null;
}

export class NotificationTestHandler implements SideEffectHandler<TestAppState> {
  abi(): string {
    return 'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)';
  }

  async handleEvent(context: SideEffectHandlerContext<TestAppState>): Promise<void> {
    const sharedState = await context.getSharedState();
    const eventParams = context.getEventParams();

    // Simulate sending a notification
    sharedState.notificationCount++;
    sharedState.lastProcessedEvent = context.event.id;

    console.log(`Notification sent for token ${eventParams.getRaw('tokenId')}`);
  }
}
