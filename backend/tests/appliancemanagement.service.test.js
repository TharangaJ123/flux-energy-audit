/**
 * @file appliancemanagement.service.test.js
 * @description Unit tests for the Appliance Management service layer.
 * Mongoose model methods and the weather service are Jest-mocked so business
 * logic (calculations, data aggregation) can be verified in isolation without
 * a live database or external API.
 */
const Appliance = require('../src/models/appliancemanagement.model');
const applianceService = require('../src/services/appliancemanagement.service');
const weatherService = require('../src/services/weatherService');
const { runInTransaction } = require('../src/util/transaction');

// Mock dependencies — Appliance model, weather API, and transaction utility.
jest.mock('../src/models/appliancemanagement.model');
jest.mock('../src/services/weatherService');
jest.mock('../src/util/transaction');

describe('Appliance Management Service', () => {
    const userId = 'user-123';
    
    beforeEach(() => {
        jest.clearAllMocks();
        // Mock transaction to just run the callback
        runInTransaction.mockImplementation(async (cb) => {
            return await cb('mock-session');
        });
    });

    describe('addAppliance', () => {
        it('should save a new appliance and return the saved document', async () => {
            const applianceData = { name: 'AC', powerConsumption: 2000, usageHours: 5 };
            const savedAppliance = { ...applianceData, user: userId, _id: 'app-123' };
            
            // Mock constructor and save method
            Appliance.prototype.save = jest.fn().mockResolvedValue(savedAppliance);

            const result = await applianceService.addAppliance(applianceData, userId);

            expect(result).toEqual(savedAppliance);
            expect(Appliance.prototype.save).toHaveBeenCalledWith({ session: 'mock-session' });
        });
    });

    describe('getAppliancesByUser', () => {
        it('should return all appliances for a user sorted by createdAt', async () => {
            const mockAppliances = [{ name: 'A' }, { name: 'B' }];
            const findMock = {
                sort: jest.fn().mockResolvedValue(mockAppliances)
            };
            Appliance.find.mockReturnValue(findMock);

            const result = await applianceService.getAppliancesByUser(userId);

            expect(result).toEqual(mockAppliances);
            expect(Appliance.find).toHaveBeenCalledWith({ user: userId });
            expect(findMock.sort).toHaveBeenCalledWith({ createdAt: -1 });
        });
    });

    describe('getApplianceById', () => {
        it('should find one appliance by ID and user ID', async () => {
            const applianceId = 'app-123';
            const mockAppliance = { _id: applianceId, name: 'AC' };
            Appliance.findOne.mockResolvedValue(mockAppliance);

            const result = await applianceService.getApplianceById(applianceId, userId);

            expect(result).toEqual(mockAppliance);
            expect(Appliance.findOne).toHaveBeenCalledWith({ _id: applianceId, user: userId });
        });
    });

    describe('getTotalEnergyConsumption', () => {
        it('should calculate energy totals and merge with weather data', async () => {
            const mockAppliances = [
                { _id: '1', name: 'Fan', dailyEnergyConsumption: 1, monthlyEnergyConsumption: 30 },
                { _id: '2', name: 'TV', dailyEnergyConsumption: 0.5, monthlyEnergyConsumption: 15 }
            ];
            const mockWeather = { temp: 32, insight: 'Hot' };
            
            Appliance.find.mockResolvedValue(mockAppliances);
            weatherService.getCurrentWeather.mockResolvedValue(mockWeather);

            const result = await applianceService.getTotalEnergyConsumption(userId, 'Colombo');

            expect(result.dailyTotalKWh).toBe(1.5);
            expect(result.monthlyTotalKWh).toBe(45);
            expect(result.applianceCount).toBe(2);
            expect(result.weatherInsights).toEqual(mockWeather);
            expect(result.appliances).toHaveLength(2);
            expect(result.appliances[0].percentage).toBeCloseTo(66.67, 1);
        });
    });

    describe('getApplianceStats', () => {
        it('should return 0 stats if no appliances found', async () => {
            Appliance.find.mockResolvedValue([]);

            const result = await applianceService.getApplianceStats(userId);

            expect(result.totalAppliances).toBe(0);
            expect(result.totalPowerWatts).toBe(0);
            expect(result.highestConsumer).toBeNull();
        });

        it('should return correct stats when appliances exist', async () => {
            const mockAppliances = [
                { name: 'AC', powerConsumption: 2000, monthlyEnergyConsumption: 300, category: 'Cooling' },
                { name: 'Fridge', powerConsumption: 200, monthlyEnergyConsumption: 144, category: 'Kitchen' }
            ];
            Appliance.find.mockResolvedValue(mockAppliances);

            const result = await applianceService.getApplianceStats(userId);

            expect(result.totalAppliances).toBe(2);
            expect(result.totalPowerWatts).toBe(2200);
            expect(result.highestConsumer.name).toBe('AC');
            expect(result.categoryBreakdown).toEqual({ 'Cooling': 1, 'Kitchen': 1 });
        });
    });
});
