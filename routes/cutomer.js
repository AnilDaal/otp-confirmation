import express from "express";
import {
  customerSignup,
  cutomerLogin,
  confirmToken,
} from "../controllers/customer.js";

const route = express.Router();

route.route("/signup").post(customerSignup);

route.route("/login").post(cutomerLogin);

route.route("/confirmToken").post(confirmToken);

export default route;
