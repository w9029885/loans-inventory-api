export type Device = {
  id: string;
  name: string;
  description: string;
  count: number /** Available number of devices of this model in the pool. */;
  updatedAt: Date;
};

export type CreateDeviceParams = {
  id: string;
  name: string;
  description: string;
  count: number;
  updatedAt: Date;
};

export class DeviceError extends Error {
  constructor(public field: string, message: string) {
    super(message);
    this.name = 'DeviceError';
  }
}

const validateDevice = (params: CreateDeviceParams): void => {
  if (!params.id || typeof params.id !== 'string' || params.id.trim() === '') {
    throw new DeviceError('id', 'Device id must be a non-empty string.');
  }
  if (
    !params.name ||
    typeof params.name !== 'string' ||
    params.name.trim() === ''
  ) {
    throw new DeviceError('name', 'Device name must be a non-empty string.');
  }
  if (!Number.isFinite(params.count) || params.count < 0) {
    throw new DeviceError(
      'count',
      'count must be a number greater than or equal to 0.'
    );
  }
  if (!Number.isInteger(params.count)) {
    throw new DeviceError('count', 'count must be an integer.');
  }
  if (
    !params.description ||
    typeof params.description !== 'string' ||
    params.description.trim() === ''
  ) {
    throw new DeviceError(
      'description',
      'Device description must be a non-empty string.'
    );
  }
  if (
    !(params.updatedAt instanceof Date) ||
    isNaN(params.updatedAt.getTime())
  ) {
    throw new DeviceError(
      'updatedAt',
      'updatedAt must be a valid Date object.'
    );
  }
};

export const createDevice = (params: CreateDeviceParams): Device => {
  validateDevice(params);

  return {
    id: params.id,
    name: params.name,
    description: params.description,
    count: params.count,
    updatedAt: params.updatedAt,
  };
};

// Comment
