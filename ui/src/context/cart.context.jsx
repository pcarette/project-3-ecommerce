import axios from "axios";
import React, { createContext, useContext, useEffect, useState } from "react";
import { AuthContext } from "./auth.context";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";
const CartContext = createContext();

function CartProviderWrapper({ children }) {
  const { isLoggedIn } = useContext(AuthContext);
  const [cartState, setCartState] = useState({
    products: [],
    status: "Pending",
  });

  const unifyCart = (itemsArray) => {
    const temp = [];
    for (let i = 0; i < itemsArray.length; i++) {
      const index = temp.findIndex(
        (item) => item.productId === itemsArray[i].productId
      );
      if (index === -1) {
        temp.push(itemsArray[i]);
      } else {
        temp[index].quantity += itemsArray[i].quantity;
      }
    }
    return temp;
  };

  const patchCartAndUpdateStateLS = (fullNewCart, id, storedToken) => {
    axios
      .patch(`${API_URL}/cart/${id}`, fullNewCart, {
        headers: {
          Authorization: `Bearer ${storedToken}`,
        },
      })
      .then((res) => {
        //LStorage + state
        localStorage.setItem("pendingCart", JSON.stringify(res.data.result));
        setCartState(res.data.result);
      })
      .catch((e) => console.log(e));
  };
  const postCartAndUpdateStateLS = (fullNewCart, storedToken) => {
    axios
      .post(`${API_URL}/cart`, fullNewCart, {
        headers: {
          Authorization: `Bearer ${storedToken}`,
        },
      })
      .then((res) => {
        //LStorage + state
        localStorage.setItem("pendingCart", JSON.stringify(res.data));
        setCartState(res.data);
      })
      .catch((e) => console.log(e));
  };

  // usefull when the user logs in
  useEffect(() => {
    if (isLoggedIn) {
      const storedCartInLS = localStorage.getItem("pendingCart");
      const storedToken = localStorage.getItem("authToken");
      axios
        .get(`${API_URL}/cart/pending`, {
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        })
        .then((res) => {
          if ("message" in res.data && storedCartInLS !== null) {
            postCartAndUpdateStateLS(
              JSON.parse(storedCartInLS).products,
              storedToken
            );
          } else if ("products" in res.data) {
            const offlineCartSTR = localStorage.getItem("offlineCart");
            if (offlineCartSTR !== null) {
              res.data.products = unifyCart([
                ...JSON.parse(offlineCartSTR),
                ...res.data.products,
              ]);
              localStorage.removeItem("offlineCart");
              patchCartAndUpdateStateLS(
                res.data.products,
                res.data._id,
                storedToken
              );
            } else {
              localStorage.setItem("pendingCart", JSON.stringify(res.data));
              setCartState(res.data);
            }
          }
        })
        .catch((e) => console.log("error ! ", e));
    }
  }, [isLoggedIn]);

  //get the "pending" Cart
  //update the sessionStorage ?
  //update the server with a patch request
  const updateServerCart = (newCart) => {
    const storedToken = localStorage.getItem("authToken");
    if (isLoggedIn) {
      const pendingCartSTR = localStorage.getItem("pendingCart");
      if (pendingCartSTR) {
        const pendingCart = JSON.parse(pendingCartSTR);
        pendingCart.products.push(newCart);
        const unifiedCart = unifyCart(pendingCart.products);
        patchCartAndUpdateStateLS(unifiedCart, pendingCart._id, storedToken);
      } else {
        postCartAndUpdateStateLS([newCart], storedToken);
      }
    } else {
      const offlineCartSTR = localStorage.getItem("offlineCart");
      if (offlineCartSTR) {
        const offlineCart = JSON.parse(offlineCartSTR);
        offlineCart.push(newCart);
        const unifiedCart = unifyCart(offlineCart);
        localStorage.setItem("offlineCart", JSON.stringify(unifiedCart));
      } else {
        localStorage.setItem("offlineCart", JSON.stringify([newCart]));
      }
    }
  };

  return (
    <CartContext.Provider
      value={{
        cartState,
        setCartState,
        updateServerCart,
        patchCartAndUpdateStateLS,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
export { CartContext, CartProviderWrapper };
