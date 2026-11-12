// The response shapes AEM's JavaScript expects from the legacy Java REST endpoints.
// Kept exact so AEM's header code runs unchanged. See retail-aem-next-poc-docs/JAVA-CONTRACT-PLAN.md.

export type JavaRestEnvelope<T> = {
  status: 'success';
  data: T;
};

// Mirrors retail_desktop UserInfoBean (the subset AEM's header reads, plus the rest as empty).
export type UserInfo = {
  name: string;
  id: string;
  email: string;
  billZip: string;
  uuid: string;
  loggedIn: boolean;
  loginsuccessful: boolean;
  welcomeMessageShown: boolean;
  zipCode: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  emarsysString: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: string;
  vehicleTrim: string;
  shipToPostalCode: string;
};

export type CartCount = {
  count: number;
};

export function javaSuccess<T>(data: T): JavaRestEnvelope<T> {
  return { status: 'success', data };
}

export const GUEST_USER: UserInfo = {
  name: '',
  id: '',
  email: '',
  billZip: '',
  uuid: '',
  loggedIn: false,
  loginsuccessful: false,
  welcomeMessageShown: false,
  zipCode: '',
  firstName: '',
  lastName: '',
  phoneNumber: '',
  emarsysString: '',
  vehicleMake: '',
  vehicleModel: '',
  vehicleYear: '',
  vehicleTrim: '',
  shipToPostalCode: '',
};
