type Reading = {
  cartId: string;
  weightKg: number;
  deviceId: string;
  receivedAt: string;
};

const readings = new Map<string, Reading>();

export function saveWeightReading(cartId: string, weightKg: number, deviceId = "demo-scale-01") {
  const reading = {
    cartId,
    weightKg,
    deviceId,
    receivedAt: new Date().toISOString()
  };
  readings.set(cartId, reading);
  return reading;
}

export function getWeightReading(cartId: string) {
  return readings.get(cartId);
}
