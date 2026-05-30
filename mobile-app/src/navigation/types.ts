export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Login: undefined;
  OTP: { mobile: string };
  Main: undefined;
  Scanner: undefined;
  ProductDetails: { productId: string };
  Cart: undefined;
  WeightStart: undefined;
  WeightSuccess: undefined;
  WeightFailed: undefined;
  PaymentSelection: undefined;
  UpiPayment: undefined;
  CardPayment: undefined;
  CashPayment: undefined;
  PaymentSuccess: undefined;
  Receipt: undefined;
  ExitQR: undefined;
  OrderHistory: undefined;
};

export type TabParamList = {
  Home: undefined;
  Browse: undefined;
  CartTab: undefined;
  Profile: undefined;
};
