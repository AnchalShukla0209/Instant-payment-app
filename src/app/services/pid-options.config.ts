export interface PidConfig {
  env: string;
  fCount: string;
  fType: string;
  iCount: string;
  iType?: string;
  pCount: string;
  pType?: string;
  format: string;
  pidVer: string;
  timeout: string;
  wadh?: string;
  otp?: string;
  posh?: string;       // Only for FINO
}

export interface AepsPidProfiles {
  [partner: string]: {
    [operation: string]: PidConfig;
  }
}

export const PID_OPTIONS_CONFIG: AepsPidProfiles = {
  JPB: {
    EKYC: {
      env: "P",
      fCount: "1",
      fType: "2",
      iCount: "0",
      pCount: "0",
      format: "0",
      pidVer: "2.0",
      timeout: "30000",
      wadh: "E0jzJ/P8UopUHAieZn8CKqS4WPMi5ZSYXgfnlfkWjrc="
    },

    BALANCE: {
      env: "P",
      fCount: "1",
      fType: "2",
      iCount: "0",
      pCount: "0",
      format: "0",
      pidVer: "2.0",
      timeout: "30000",
      wadh: ""
    }
  },

  FINO: {
    BALANCE: {
      env: "P",
      fCount: "1",
      fType: "2",
      iCount: "0",
      iType: "0",
      pCount: "0",
      pType: "0",
      format: "0",
      pidVer: "2.0",
      timeout: "20000",
      wadh: "",
      otp: "",
      posh: "UNKNOWN"
    },

    EKYC: {
      env: "P",
      fCount: "1",
      fType: "2",
      iCount: "0",
      iType: "0",
      pCount: "0",
      pType: "0",
      format: "0",
      pidVer: "2.0",
      timeout: "20000",
      wadh: "18f4CEiXeXcfGXvgWA/blxD+w2pw7hfQPY45JMytkPw=",
      otp: "",
      posh: "UNKNOWN"
    }
  },

  PPI: {
    BALANCE: {
      env: "P",
      fCount: "1",
      fType: "2",
      iCount: "0",
      iType: "0",
      pCount: "0",
      pType: "0",
      format: "0",
      pidVer: "2.0",
      timeout: "20000",
      wadh: "",
      otp: "",
      posh: "UNKNOWN"
    },

    EKYC: {
      env: "P",
      fCount: "1",
      fType: "2",
      iCount: "0",
      iType: "0",
      pCount: "0",
      pType: "0",
      format: "0",
      pidVer: "2.0",
      timeout: "20000",
      wadh: "TF/lfPuh1n4ZY1xizYpqikIBm+gv65r51MFNek4uwNw=",
      otp: "",
      posh: "UNKNOWN"
    }
  },


  STARTEK: {
    BALANCE: {
      env: "P",
      fCount: "1",
      fType: "0",
      iCount: "0",
      pCount: "0",
      format: "0",
      pidVer: "2.0",
      timeout: "10000",
      wadh: ""
    }
  }
};
