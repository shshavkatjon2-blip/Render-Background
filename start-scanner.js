process.env.WORKER_MODE = "scanner";
process.env.PAYMENT_SCANNER_ENABLED = "true";

require("../server");
