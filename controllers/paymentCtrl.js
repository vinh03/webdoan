const stripe = require("stripe")(process.env.STRIPE_PRIVATE_KEY);
const Payments = require("../models/paymentModal");
const Users = require("../models/userModel");
const Products = require("../models/productModel");

const paymentCtrl = {
  createPayment: async (req, res) => {
    try {
      const session = await stripe.checkout.sessions.create({
        line_items: req.body.lineItems,
        mode: "payment",
        payment_method_types: ["card"],
        success_url: `http://localhost:3000/success/{CHECKOUT_SESSION_ID}`,
        cancel_url: "http://localhost:3000",
      });

      return res.status(201).json(session);
    } catch (error) {
      return res.status(500).json(error);
    }
  },
  retrieveSession: async (req, res) => {
    try {
      const sessionId = req.params.id;
      const retrievedSession = await stripe.checkout.sessions.retrieve(
        sessionId
      );

      return res.status(200).json(retrievedSession);
    } catch (error) {
      return res.status(500).json(error);
    }
  },
  getPayments: async (req, res) => {
    try {
      const payments = await Payments.find();
      res.json(payments);
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
  updateIfSuccess: async (req, res) => {
    try {
      const user = await Users.findById(req.user.id).select("name email");
      if (!user) return res.status(400).json({ msg: "User does not exist." });

      const { cart, paymentID, address, status } = req.body;

      const { _id, name, email } = user;

      const newPayment = new Payments({
        user_id: _id,
        name,
        email,
        cart,
        paymentID,
        address,
        status
      });

      cart.filter((item) => {
        return sold(item._id, item.quantity, item.sold);
      });

      await newPayment.save();
      res.json({ msg: "Payment Success!" });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
};

const sold = async (id, quantity, oldSold) => {
  await Products.findOneAndUpdate(
    { _id: id },
    {
      sold: quantity + oldSold,
    }
  );
};
module.exports = paymentCtrl;
