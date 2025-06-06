import logger from '@/common/utils/logger';
import { Location } from '@/models/location.model';
import type { ILocation } from '@/models/location.model';

export class LocationService {
  public async createLocation(location: ILocation): Promise<ILocation | null> {
    try {
      const createdLocation = await Location.create(location);
      return createdLocation;
    } catch (error) {
      logger.error('Error creating location', { error });
      throw error;
    }
  }

  public async deleteLocation(id: string): Promise<ILocation | null> {
    try {
      const deletedLocation = await Location.findByIdAndDelete(id);
      return deletedLocation;
    } catch (error) {
      logger.error('Error deleting location', { error });
      throw error;
    }
  }
}
