import axios from 'axios';

const test = async () => {
  try {
    const res = await axios.post('http://localhost:2000/gift-cards/payment-webhook', {
      gift_card_id: "6a2aaacbda65bf6b3f407a6a",
      razorpay_order_id: "order_T0KDk8wqS0qkBj",
      razorpay_payment_id: "pay_T0KDr87b9DeH0G",
      razorpay_signature: "mock_signature"
    });
    console.log("Response Status:", res.status);
    console.log("Response Data:", res.data);
  } catch (err) {
    if (err.response) {
      console.log("Error Status:", err.response.status);
      console.log("Error Data:", err.response.data);
    } else {
      console.error("Network / Other Error:", err.message);
    }
  }
};

test();
