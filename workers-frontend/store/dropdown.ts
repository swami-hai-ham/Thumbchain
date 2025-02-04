import { create } from "zustand";

interface DropdownStateProps {
  countryValue: string;
  setCountryValue: (country: string) => void;
  openCountryDropdown: boolean;
  setOpenCountryDropdown: (openCountry: boolean) => void;
  stateValue: string;
  setStateValue: (state: string) => void;
  openStateDropdown: boolean;
  setOpenStateDropdown: (openState: boolean) => void;
}

interface PendingAmt {
  amount: number;
  setAmount: (amount: number) => void;
}

interface SurveyId {
  id: string | undefined;
  setId: (id: string) => void;
}

interface Data {
  question: string;
  type: string;
  options: string[] | null;
  orderId: number;
  questionId: string;
  formId: string;
  description: string | null;
}

interface CurrentQuestion {
  data: Data | null;
  setData: (data: Data) => void;
}

export const useDropdownStore = create<DropdownStateProps>((set) => ({
  countryValue: "",
  setCountryValue: (country: string) => {
    set({ countryValue: country });
  },
  openCountryDropdown: false,
  setOpenCountryDropdown: (openCountry: boolean) => {
    set({ openCountryDropdown: openCountry });
  },
  stateValue: "",
  setStateValue: (state: string) => {
    set({ stateValue: state });
  },
  openStateDropdown: false,
  setOpenStateDropdown: (openState: boolean) => {
    set({ openStateDropdown: openState });
  },
}));

export const usePendingAmt = create<PendingAmt>((set) => ({
  amount: 0,
  setAmount: (amount: number) => {
    set({ amount: amount });
  },
}));

export const useSurveyId = create<SurveyId>((set) => ({
  id: undefined,
  setId: (id: string) => {
    set({ id: id });
  },
}));

export const useCurrentQuestion = create<CurrentQuestion>((set) => ({
  data: null,
  setData: (data) => set({ data }),
}));
