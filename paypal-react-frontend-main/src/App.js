import React, { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom";
import { useSearchParams } from "react-router-dom";

import "./App.css";
import { Slide, ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_URL = process.env.REACT_APP_BASE_URL;
const PAYPAL_CLIENT_ID = process.env.REACT_APP_PAYPAL_CLIENT_ID;

const App = () => {
  const toastId = 'paypal-app';
  const [searchParams] = useSearchParams();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('');
  const [sdkReady, setSdkReady] = useState(
    () => typeof window !== 'undefined' && Boolean(window.paypal)
  );

  useEffect(() => {
    const paymentmethod = searchParams.get("method");
    if (paymentmethod === '_withdraw') {
      setName(
        searchParams.get("email") ||
          searchParams.get("name") ||
          ''
      );
    } else {
      setName('');
    }

    setAmount(searchParams.get("amount") || '');
    setMethod(paymentmethod || '');
  }, [searchParams]);

  useEffect(() => {
    if (!PAYPAL_CLIENT_ID) return;
    if (window.paypal) {
      setSdkReady(true);
      return;
    }
    const selector = 'script[data-paypal-checkout-sdk]';
    let script = document.querySelector(selector);
    const onLoad = () => setSdkReady(true);
    if (script) {
      if (window.paypal) onLoad();
      else script.addEventListener('load', onLoad);
      return;
    }
    script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(
      PAYPAL_CLIENT_ID
    )}&currency=USD`;
    script.async = true;
    script.dataset.paypalCheckoutSdk = 'true';
    script.onload = onLoad;
    document.body.appendChild(script);
  }, []);

  const PayPalButton = useMemo(() => {
    if (!sdkReady || !window.paypal) return null;
    return window.paypal.Buttons.driver("react", { React, ReactDOM });
  }, [sdkReady]);

  const checkoutReady =
    method === '_deposit' ||
    (method === '_withdraw' && String(name).trim() !== '');

  async function _createOrder() {
    if (!API_URL) {
      toast.error('Missing REACT_APP_BASE_URL. Add it to your .env file.', {
        position: toast.POSITION.TOP_RIGHT,
        toastId
      });
      return;
    }
    if (method !== '_deposit' && method !== '_withdraw') {
      toast.error('Invalid checkout: URL must include method=_deposit or method=_withdraw.', {
        position: toast.POSITION.TOP_RIGHT,
        toastId
      });
      return;
    }
    if (method === '_withdraw' && !String(name).trim()) {
      toast.error('Withdraw requires a payee email (use email= or name= in the URL).', {
        position: toast.POSITION.TOP_RIGHT,
        toastId
      });
      return;
    }
    if (!String(amount).trim()) {
      toast.error('Amount is missing (add amount= to the URL).', {
        position: toast.POSITION.TOP_RIGHT,
        toastId
      });
      return;
    }
    try {
      const body =
        method === '_deposit'
          ? {
              purchase_info: {
                amount: String(amount).trim(),
                paymentmethod: method,
              },
            }
          : {
              purchase_info: {
                email: String(name).trim(),
                amount: String(amount).trim(),
                paymentmethod: method,
              },
            };

      const response = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      let orderData;
      const text = await response.text();
      try {
        orderData = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(text || `HTTP ${response.status}`);
      }

      if (orderData.id) {
        return orderData.id;
      }
      const errorDetail = orderData?.details?.[0];
      const apiErr =
        orderData?.error ||
        (errorDetail
          ? `${errorDetail.issue} ${errorDetail.description} (${orderData.debug_id})`
          : text || `HTTP ${response.status}`);
      throw new Error(typeof apiErr === 'string' ? apiErr : JSON.stringify(apiErr));
    } catch (error) {
      console.error(error);
      toast.error(`Could not initiate PayPal Checkout...${error}`, {
        position: toast.POSITION.TOP_RIGHT,
        toastId
      });
    }
  }
  async function _onApprove(data, actions) {
    if (!API_URL) return;
    try {
      const response = await fetch(`${API_URL}/api/orders/${data.orderID}/capture`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const text = await response.text();
      let orderData;
      try {
        orderData = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(text || `HTTP ${response.status}`);
      }
      const errorDetail = orderData?.details?.[0];

      if (errorDetail?.issue === "INSTRUMENT_DECLINED") {
        return actions.restart();
      } else if (errorDetail) {
        throw new Error(`${errorDetail.description} (${orderData.debug_id})`);
      } else if (!orderData.purchase_units) {
        throw new Error(JSON.stringify(orderData));
      } else {
        const transaction =
          orderData?.purchase_units?.[0]?.payments?.captures?.[0] ||
          orderData?.purchase_units?.[0]?.payments?.authorizations?.[0];
        if (!transaction?.id) {
          throw new Error('Capture succeeded but no transaction id was returned.');
        }
        toast.success(`Transaction ${transaction.status}: ${transaction.id}`, {
          position: 'top-center',
          autoClose: 3000,
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
    const errObj = {
      err: err,
      status: "FAILED",
    };
    window.ReactNativeWebView &&
      window.ReactNativeWebView.postMessage(JSON.stringify(errObj));
  }

  return (
    <div className="flex flex-col w-full h-screen justify-evenly items-center p-4">
      {!PAYPAL_CLIENT_ID && (
        <p className="text-center text-red-600 max-w-md">
          Set <code className="bg-gray-100 px-1 rounded">REACT_APP_PAYPAL_CLIENT_ID</code> in{' '}
          <code className="bg-gray-100 px-1 rounded">.env</code> (see <code className="bg-gray-100 px-1 rounded">.env.example</code>).
        </p>
      )}
      {PAYPAL_CLIENT_ID && !PayPalButton && (
        <p className="text-gray-600">Loading PayPal…</p>
      )}
      {PayPalButton && checkoutReady && (
        <PayPalButton
          createOrder={() => _createOrder()}
          onApprove={(data, actions) => _onApprove(data, actions)}
          onCancel={() => _onError("CANCELED")}
          onError={() => _onError("ERROR")}
        />
      )}
      {PayPalButton && method === '_withdraw' && !String(name).trim() && (
        <p className="text-center text-amber-800 max-w-md">
          Add a payee email to the URL, for example{' '}
          <code className="bg-amber-100 px-1 rounded">?method=_withdraw&amp;amount=5.00&amp;email=payee@example.com</code>
        </p>
      )}
      {PayPalButton && method && method !== '_deposit' && method !== '_withdraw' && (
        <p className="text-center text-red-600 max-w-md">
          Unknown <code className="bg-gray-100 px-1 rounded">method</code>. Use{' '}
          <code className="bg-gray-100 px-1 rounded">_deposit</code> or{' '}
          <code className="bg-gray-100 px-1 rounded">_withdraw</code>.
        </p>
      )}
      {PayPalButton && !method && (
        <p className="text-center text-gray-700 max-w-md">
          Add checkout parameters, for example{' '}
          <code className="bg-gray-100 px-1 rounded">?method=_deposit&amp;amount=10.00</code>
        </p>
      )}
      <div className="toast-container"><ToastContainer limit={2} /></div>
    </div>
  );
};
export default App;
