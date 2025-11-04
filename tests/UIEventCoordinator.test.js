import { UIEventCoordinator } from '../ui/UIEventCoordinator.js';
import { eventBus } from '@core/EventBus';
import { EventTypes } from '@core/EventTypes';

describe('UIEventCoordinator', () => {
    let coordinator;
    let mockGame;
    let mockMessageManager;
    let mockPanelManager;

    beforeEach(() => {
        // Clear all event listeners before each test
        eventBus.clear();

        // Mock game
        mockGame = {
            pendingConfirmationAction: null,
            pendingConfirmationData: null
        };

        // Mock MessageManager
        mockMessageManager = {
            showOverlayMessage: vi.fn(),
            hideOverlayMessage: vi.fn(),
            showSignMessage: vi.fn(),
            addMessageToLog: vi.fn(),
            showRegionNotification: vi.fn()
        };

        // Mock PanelManager
        mockPanelManager = {
            showBarterWindow: vi.fn(),
            hideBarterWindow: vi.fn(),
            showStatueInfoWindow: vi.fn(),
            hideStatueInfoWindow: vi.fn()
        };

        // Create coordinator
        coordinator = new UIEventCoordinator(mockGame, mockMessageManager, mockPanelManager);
    });

    afterEach(() => {
        eventBus.clear();
    });

    describe('Dialog Events', () => {
        test('UI_DIALOG_SHOW with barter type shows barter window', () => {
            eventBus.emit(EventTypes.UI_DIALOG_SHOW, {
                type: 'barter',
                npc: 'penne',
                playerPos: { x: 5, y: 5 },
                npcPos: { x: 6, y: 5 }
            });

            expect(mockPanelManager.showBarterWindow).toHaveBeenCalledWith('penne');
        });

        test('UI_DIALOG_SHOW with sign type shows sign message', () => {
            eventBus.emit(EventTypes.UI_DIALOG_SHOW, {
                type: 'sign',
                message: 'Welcome to the tavern!',
                portrait: 'assets/portrait.png',
                name: 'Innkeeper'
            });

            expect(mockMessageManager.showSignMessage).toHaveBeenCalledWith(
                'Welcome to the tavern!',
                'assets/portrait.png',
                'Innkeeper',
                null
            );
        });

        test('UI_DIALOG_SHOW with statue type shows statue window', () => {
            eventBus.emit(EventTypes.UI_DIALOG_SHOW, {
                type: 'statue'
            });

            expect(mockPanelManager.showStatueInfoWindow).toHaveBeenCalled();
        });

        test('UI_DIALOG_SHOW with invalid type logs error', () => {
            const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation();

            eventBus.emit(EventTypes.UI_DIALOG_SHOW, {
                type: 'invalid_type'
            });

            expect(consoleWarnSpy).toHaveBeenCalledWith(
                expect.stringContaining('Unknown dialog type: invalid_type')
            );

            consoleWarnSpy.mockRestore();
        });

        test('UI_DIALOG_HIDE with barter type hides barter window', () => {
            eventBus.emit(EventTypes.UI_DIALOG_HIDE, {
                type: 'barter'
            });

            expect(mockPanelManager.hideBarterWindow).toHaveBeenCalled();
        });

        test('UI_DIALOG_HIDE with statue type hides statue window', () => {
            eventBus.emit(EventTypes.UI_DIALOG_HIDE, {
                type: 'statue'
            });

            expect(mockPanelManager.hideStatueInfoWindow).toHaveBeenCalled();
        });

        test('UI_DIALOG_HIDE with sign type hides overlay message', () => {
            eventBus.emit(EventTypes.UI_DIALOG_HIDE, {
                type: 'sign'
            });

            expect(mockMessageManager.hideOverlayMessage).toHaveBeenCalled();
        });
    });

    describe('Confirmation Events', () => {
        test('UI_CONFIRMATION_SHOW displays confirmation with action', () => {
            const chargeData = { item: 'bishop_spear', target: { x: 5, y: 5 } };

            eventBus.emit(EventTypes.UI_CONFIRMATION_SHOW, {
                message: 'Tap again to confirm Bishop Charge',
                action: 'bishop_charge',
                data: chargeData,
                persistent: true,
                largeText: true,
                useTypewriter: false
            });

            expect(mockGame.pendingConfirmationAction).toBe('bishop_charge');
            expect(mockGame.pendingConfirmationData).toBe(chargeData);
            expect(mockMessageManager.showOverlayMessage).toHaveBeenCalledWith(
                'Tap again to confirm Bishop Charge',
                null,
                true,
                true,
                false
            );
        });

        test('UI_CONFIRMATION_SHOW uses default values for optional params', () => {
            eventBus.emit(EventTypes.UI_CONFIRMATION_SHOW, {
                message: 'Confirm action?',
                action: 'test_action'
            });

            expect(mockMessageManager.showOverlayMessage).toHaveBeenCalledWith(
                'Confirm action?',
                null,
                true,  // persistent default
                true,  // largeText default
                false  // useTypewriter default
            );
        });
    });

    describe('Overlay Message Events', () => {
        test('UI_OVERLAY_MESSAGE_SHOW displays overlay message', () => {
            eventBus.emit(EventTypes.UI_OVERLAY_MESSAGE_SHOW, {
                text: 'You found a treasure!',
                imageSrc: 'assets/treasure.png',
                persistent: false,
                largeText: true,
                useTypewriter: true
            });

            expect(mockMessageManager.showOverlayMessage).toHaveBeenCalledWith(
                'You found a treasure!',
                'assets/treasure.png',
                false,
                true,
                true
            );
        });

        test('UI_OVERLAY_MESSAGE_SHOW uses default values', () => {
            eventBus.emit(EventTypes.UI_OVERLAY_MESSAGE_SHOW, {
                text: 'Simple message'
            });

            expect(mockMessageManager.showOverlayMessage).toHaveBeenCalledWith(
                'Simple message',
                null,   // imageSrc default
                false,  // persistent default
                false,  // largeText default
                true    // useTypewriter default
            );
        });

        test('UI_OVERLAY_MESSAGE_HIDE hides overlay message', () => {
            eventBus.emit(EventTypes.UI_OVERLAY_MESSAGE_HIDE);

            expect(mockMessageManager.hideOverlayMessage).toHaveBeenCalled();
        });
    });

    describe('Message Log Events', () => {
        test('UI_MESSAGE_LOG adds message to log', () => {
            eventBus.emit(EventTypes.UI_MESSAGE_LOG, {
                text: 'Inventory is full!',
                category: 'trade',
                priority: 'warning',
                timestamp: Date.now()
            });

            expect(mockMessageManager.addMessageToLog).toHaveBeenCalledWith('Inventory is full!');
        });

        test('UI_MESSAGE_LOG adds category prefix for error priority', () => {
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation();

            eventBus.emit(EventTypes.UI_MESSAGE_LOG, {
                text: 'Something went wrong',
                category: 'combat',
                priority: 'error',
                timestamp: Date.now()
            });

            expect(mockMessageManager.addMessageToLog).toHaveBeenCalledWith('[COMBAT] Something went wrong');
            expect(consoleErrorSpy).toHaveBeenCalled();

            consoleErrorSpy.mockRestore();
        });

        test('UI_MESSAGE_LOG works with minimal data', () => {
            eventBus.emit(EventTypes.UI_MESSAGE_LOG, {
                text: 'Simple message'
            });

            expect(mockMessageManager.addMessageToLog).toHaveBeenCalledWith('Simple message');
        });
    });

    describe('Region Notification Events', () => {
        test('UI_REGION_NOTIFICATION_SHOW displays region notification', () => {
            eventBus.emit(EventTypes.UI_REGION_NOTIFICATION_SHOW, {
                x: 5,
                y: 10,
                regionName: 'The Dark Forest'
            });

            expect(mockMessageManager.showRegionNotification).toHaveBeenCalledWith(5, 10);
        });

        test('UI_REGION_NOTIFICATION_SHOW works without region name', () => {
            eventBus.emit(EventTypes.UI_REGION_NOTIFICATION_SHOW, {
                x: 3,
                y: 7
            });

            expect(mockMessageManager.showRegionNotification).toHaveBeenCalledWith(3, 7);
        });
    });

    describe('Event Integration', () => {
        test('multiple events in sequence work correctly', () => {
            // Show a dialog
            eventBus.emit(EventTypes.UI_DIALOG_SHOW, {
                type: 'barter',
                npc: 'squig'
            });

            // Log a message
            eventBus.emit(EventTypes.UI_MESSAGE_LOG, {
                text: 'Trade complete!'
            });

            // Hide the dialog
            eventBus.emit(EventTypes.UI_DIALOG_HIDE, {
                type: 'barter'
            });

            expect(mockPanelManager.showBarterWindow).toHaveBeenCalledWith('squig');
            expect(mockMessageManager.addMessageToLog).toHaveBeenCalledWith('Trade complete!');
            expect(mockPanelManager.hideBarterWindow).toHaveBeenCalled();
        });

        test('coordinator handles events independently', () => {
            // Both events should be handled without interference
            eventBus.emit(EventTypes.UI_OVERLAY_MESSAGE_SHOW, {
                text: 'Message 1'
            });

            eventBus.emit(EventTypes.UI_MESSAGE_LOG, {
                text: 'Message 2'
            });

            expect(mockMessageManager.showOverlayMessage).toHaveBeenCalledWith(
                'Message 1',
                null,
                false,
                false,
                true
            );
            expect(mockMessageManager.addMessageToLog).toHaveBeenCalledWith('Message 2');
        });
    });
});
