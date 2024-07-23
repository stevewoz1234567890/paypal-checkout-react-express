import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { useSearchParams } from "react-router-dom";

import "./App.css";
import { Slide, ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const PayPalButton = window.paypal.Buttons.driver("react", { React, ReactDOM });
const API_URL = process.env.REACT_APP_BASE_URL;

const App = () => {
  const toastId = 'paypal-app';
  const [searchParams, setSearchParams] = useSearchParams();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('');

  // alert(window.email);
  useEffect(() => {
    // alert(searchParams.get("email"));
    const paymentmethod = searchParams.get("method");
    if (paymentmethod === '_withdraw') {
      setName(searchParams.get("name"));
    }

    setAmount(searchParams.get("amount"));
    setMethod(paymentmethod);
  }, [searchParams])

  async function _createOrder() {
    try {
      let createOrderData = {};
      if (method === '_deposit') {
        createOrderData = {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          // use the "body" param to optionally pass additional order information
          // like product ids and quantities
          body: JSON.stringify({
            purchase_info: {
              amount: amount,
              paymentmethod: method
            }
          }),
        }
      } else if (method === '_withdraw') {
        createOrderData = {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          // use the "body" param to optionally pass additional order information
          // like product ids and quantities
          body: JSON.stringify({
            purchase_info: {
              email: name,
              amount: amount,
              paymentmethod: method
            }
          }),
        }
      }

      const response = await fetch(`${API_URL}/api/orders`, createOrderData);

      const orderData = await response.json();

      if (orderData.id) {
        return orderData.id;
      } else {
        const errorDetail = orderData?.details?.[0];
        const errorMessage = errorDetail
          ? `${errorDetail.issue} ${errorDetail.description} (${orderData.debug_id})`
          : JSON.stringify(orderData);

        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error(error);
      toast.error(`Could not initiate PayPal Checkout...${error}`, {
        position: toast.POSITION.TOP_RIGHT,
        toastId
      });
    }
  }
  async function _onApprove(data, actions) {
    try {
      const response = await fetch(`${API_URL}/api/orders/${data.orderID}/capture`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const orderData = await response.json();
      // Three cases to handle:
      //   (1) Recoverable INSTRUMENT_DECLINED -> call actions.restart()
      //   (2) Other non-recoverable errors -> Show a failure message
      //   (3) Successful transaction -> Show confirmation or thank you message

      const errorDetail = orderData?.details?.[0];

      if (errorDetail?.issue === "INSTRUMENT_DECLINED") {
        // (1) Recoverable INSTRUMENT_DECLINED -> call actions.restart()
        // recoverable state, per https://developer.paypal.com/docs/checkout/standard/customize/handle-funding-failures/
        return actions.restart();
      } else if (errorDetail) {
        // (2) Other non-recoverable errors -> Show a failure message
        throw new Error(`${errorDetail.description} (${orderData.debug_id})`);
      } else if (!orderData.purchase_units) {
        throw new Error(JSON.stringify(orderData));
      } else {
        // (3) Successful transaction -> Show confirmation or thank you message
        // Or go to another URL:  actions.redirect('thank_you.html');
        const transaction =
          orderData?.purchase_units?.[0]?.payments?.captures?.[0] ||
          orderData?.purchase_units?.[0]?.payments?.authorizations?.[0];
        toast.success(`Transaction ${transaction.status}: ${transaction.id}`, {
          position: 'top-center',
          autoClose: 3000, //3 seconds
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          toastId,
          transition: Slide
        });
        console.log(
          "Capture result",
          orderData,
          JSON.stringify(orderData, null, 2),
        );
        window.ReactNativeWebView &&
          window.ReactNativeWebView.postMessage(JSON.stringify(orderData));
      }
    } catch (error) {
      console.error(error);
      toast.error(`Sorry, your transaction could not be processed... ${error}`, {
        position: toast.POSITION.TOP_RIGHT,
        toastId
      });
    }
  }
  function _onError(err) {
    let errObj = {
      err: err,
      status: "FAILED",
    };
    window.ReactNativeWebView &&
      window.ReactNativeWebView.postMessage(JSON.stringify(errObj));
  }

  return (
    <div className="flex flex-col w-full h-screen justify-evenly items-center">
      <PayPalButton
        createOrder={(data, actions) => _createOrder(data, actions)}
        onApprove={(data, actions) => _onApprove(data, actions)}
        onCancel={() => _onError("CANCELED")}
        onError={(err) => _onError("ERROE")}
      />
      <div className="toast-container"><ToastContainer limit={2} /></div>
    </div>
  );
}
export default App;