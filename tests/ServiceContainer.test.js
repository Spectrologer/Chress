import { ServiceContainer } from '@core/ServiceContainer';

describe('ServiceContainer - Lazy Initialization', () => {
  let mockGame;
  let serviceContainer;

  beforeEach(() => {
    // Minimal game mock - no need to create everything!
    mockGame = {
      world: { player: null },
      ui: {},
      audio: {}
    };

    serviceContainer = new ServiceContainer(mockGame);
  });

  describe('Lazy initialization', () => {
    test('services are not created until accessed', () => {
      // Container created but no services instantiated yet
      expect(serviceContainer.has('textureManager')).toBe(false);
      expect(serviceContainer.has('inventoryService')).toBe(false);
      expect(serviceContainer.has('combatManager')).toBe(false);
    });

    test('service is created on first access', () => {
      // First access creates the service
      const textureManager = serviceContainer.get('textureManager');

      expect(textureManager).toBeDefined();
      expect(serviceContainer.has('textureManager')).toBe(true);

      // Other services still not created
      expect(serviceContainer.has('combatManager')).toBe(false);
    });

    test('same instance is returned on subsequent access', () => {
      const first = serviceContainer.get('textureManager');
      const second = serviceContainer.get('textureManager');

      expect(first).toBe(second);
    });

    test('can manually set service for testing/mocking', () => {
      const mockInventoryService = {
        addItem: jest.fn(),
        removeItem: jest.fn()
      };

      serviceContainer.set('inventoryService', mockInventoryService);

      const retrieved = serviceContainer.get('inventoryService');
      expect(retrieved).toBe(mockInventoryService);
    });

    test('can clear all services', () => {
      serviceContainer.get('textureManager');
      serviceContainer.get('inventoryService');

      expect(serviceContainer.has('textureManager')).toBe(true);
      expect(serviceContainer.has('inventoryService')).toBe(true);

      serviceContainer.clear();

      expect(serviceContainer.has('textureManager')).toBe(false);
      expect(serviceContainer.has('inventoryService')).toBe(false);
    });

    test('throws error for unknown service', () => {
      expect(() => {
        serviceContainer.get('unknownService');
      }).toThrow('Unknown service: unknownService');
    });
  });

  describe('Service dependencies', () => {
    test('dependent services are created automatically', () => {
      // combatManager depends on turnManager
      const combatManager = serviceContainer.get('combatManager');

      expect(combatManager).toBeDefined();
      expect(serviceContainer.has('turnManager')).toBe(true);
    });

    test('inventoryUI depends on inventoryService', () => {
      const inventoryUI = serviceContainer.get('inventoryUI');

      expect(inventoryUI).toBeDefined();
      expect(serviceContainer.has('inventoryService')).toBe(true);
    });

    test('can mock dependencies before accessing dependent service', () => {
      const mockInventoryService = { mockMethod: jest.fn() };
      serviceContainer.set('inventoryService', mockInventoryService);

      // Now when we get inventoryUI, it will use our mock
      const inventoryUI = serviceContainer.get('inventoryUI');

      // The inventoryUI constructor receives the mocked service
      expect(inventoryUI).toBeDefined();
    });
  });

  describe('Backward compatibility with createCoreServices', () => {
    beforeEach(() => {
      // Mock DOM elements required by UIManager and other services
      const mockElement = {
        classList: { add: jest.fn(), remove: jest.fn(), contains: jest.fn() },
        style: {},
        textContent: '',
        innerHTML: '',
        addEventListener: jest.fn(),
        appendChild: jest.fn(),
        getBoundingClientRect: jest.fn().mockReturnValue({}),
        closest: jest.fn().mockReturnValue(null)
      };

      document.getElementById = jest.fn().mockReturnValue(mockElement);
      document.querySelector = jest.fn().mockReturnValue(mockElement);
      document.createElement = jest.fn().mockReturnValue(mockElement);

      // Mock canvas context
      HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue({
        drawImage: jest.fn(),
        clearRect: jest.fn(),
        fillRect: jest.fn(),
        save: jest.fn(),
        restore: jest.fn()
      });
    });

    test('createCoreServices initializes all services eagerly', () => {
      serviceContainer.createCoreServices();

      // Check that various services are now initialized
      expect(serviceContainer.has('textureManager')).toBe(true);
      expect(serviceContainer.has('inventoryService')).toBe(true);
      expect(serviceContainer.has('combatManager')).toBe(true);
      expect(serviceContainer.has('gameStateManager')).toBe(true);

      // And they're also assigned to game object
      expect(mockGame.textureManager).toBeDefined();
      expect(mockGame.inventoryService).toBeDefined();
      expect(mockGame.combatManager).toBeDefined();
    });

    test('createCoreServices handles legacy aliases', () => {
      serviceContainer.createCoreServices();

      // itemService should be an alias for inventoryService
      expect(mockGame.itemService).toBe(mockGame.inventoryService);

      // inventoryManager should reference inventoryUI
      expect(mockGame.inventoryManager).toBe(mockGame.inventoryUI);
    });
  });

  describe('Testing benefits', () => {
    test('can create minimal game context for testing specific service', () => {
      // Only need to mock what we're actually testing
      const mockInventoryService = {
        addItem: jest.fn(),
        removeItem: jest.fn(),
        hasItem: jest.fn().mockReturnValue(true)
      };

      serviceContainer.set('inventoryService', mockInventoryService);

      // Now we can test functionality that uses inventoryService
      // without initializing 30+ other services
      const service = serviceContainer.get('inventoryService');
      service.addItem({ type: 'sword' });

      expect(mockInventoryService.addItem).toHaveBeenCalledWith({ type: 'sword' });
    });

    test('can test service in isolation without full game initialization', () => {
      // Just get the one service we need
      const textureManager = serviceContainer.get('textureManager');

      // Only textureManager is created, not all 30+ services
      expect(serviceContainer.has('textureManager')).toBe(true);
      expect(serviceContainer.has('combatManager')).toBe(false);
      expect(serviceContainer.has('zoneManager')).toBe(false);
    });
  });
});
