import React from "react";
import {
  deleteProductFromCart,
  updateStateWithNewCart,
  increaseQuantity,
  decreaseQuantity
} from "../redux_actions.js";
import { connect } from "react-redux";
import CartItem from "./cart_item";
import { randomId } from "../randomIdGenerator";
import StripeCheckout from "react-stripe-checkout";

class CartContainer extends React.Component {
  //stripe token callback
  onToken = (token) => {
    const charge = {
      token: token.id,
    };

    const totalPrice = this.calculateTotalPrice(this.props.products);

    fetch("https://health-and-fit-store-api.herokuapp.com/create-charge", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        charge: charge,
        price: totalPrice * 100,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        this.handleCheckout();
      });
  };

  arrOfCartItems = () => {
    const niceData = this.props.products;

    return niceData.map((productObj) => {
      return <li style={{ listStyleType: "none" }} key={randomId()}>
        <CartItem
          productId={productObj.product.id}
          name={productObj.product.name}
          image={productObj.product.image}
          description={productObj.product.description}
          quantity={productObj.quantity}
          price={productObj.product.price}
          delete={this.deleteFromCart}
          decrementQuantity={this.decrementQuantity}
          incrementQuantity={this.incrementQuantity}
        />
      </li>
    });
  };

  decrementQuantity = (productId) => {
    const cartId = this.props.cartId;
    //logic to increae quantity
    fetch("https://health-and-fit-store-api.herokuapp.com/decrement-quantity", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: localStorage.token,
      },
      body: JSON.stringify({
        productId: productId,
        cartId: cartId
      })
    })
      .then((res) => res.json())
      .then((updatedProduct) => {
        this.props.decreaseQuantity(updatedProduct)
      });
  };

  incrementQuantity = (productId) => {
    const cartId = this.props.cartId;
    //logic to increae quantity
    fetch("https://health-and-fit-store-api.herokuapp.com/increment-quantity", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: localStorage.token,
      },
      body: JSON.stringify({
        productId: productId,
        cartId: cartId
      })
    })
      .then((res) => res.json())
      .then((updatedProduct) => {
        this.props.increaseQuantity(updatedProduct)
      });
  };

  calculateTotalPrice = (productsArr) => {
    let totalPrice = 0;

    productsArr.forEach( productObj => {
      totalPrice += (productObj.product.price * productObj.quantity);
    })

    return totalPrice;
  }

  handleCheckout = () => {
    //send a post request to the backend to switch the current cart's checkout attribute to true
    //return a new cart
    const cartId = this.props.cartId;
    //POST request to send cart id and token
    fetch("https://health-and-fit-store-api.herokuapp.com/check-out", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: localStorage.token,
      },
      body: JSON.stringify({
        cartId: cartId,
      }),
    })
      .then((res) => res.json())
      .then((newCartInfo) => {
        this.props.updateStateWithNewCart(newCartInfo);
      });
  };

  deleteFromCart = (productId) => {
    const cartId = this.props.cartId;
    fetch("https://health-and-fit-store-api.herokuapp.com/delete-from-cart", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": localStorage.token
      },
      body: JSON.stringify({
        productId: productId,
        cartId: cartId
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        this.props.deleteProductFromCart(data.product);
      });
  };

  render() {
    const buttonStyles = {
      background: "black",
      color: "white",
      width: "25%",
      padding: "5px",
      margin: "20px",
      borderRadius:"30px"
    };

    const component = (
      <>
        <ul>{this.arrOfCartItems()}</ul>
      </>
    );

    const totalPrice = this.calculateTotalPrice(this.props.products);
    

    const ternary =
      this.props.products.length > 0 ? (
        component
      ) : (
        <div>
          <p style={{ fontSize: "18px" }}>Your Cart is empty</p>
        </div>
      );
    return (
      <div id="cart-container">
        <p style={{ fontWeight: "bold", fontSize: "23px" }}>
          Total Price: ${totalPrice}
        </p>
        <ul>{ternary}</ul>

        <StripeCheckout
          name="Health and Fitness Store"
          description="Please Enter the Relevant Info Below"
          amount={totalPrice * 100}
          shippingAddress={true}
          billingAddress={true}
          autocomplete="off"
          currency="USD"
          closed={() => alert("Thank you for shopping with us!")}
          token={this.onToken}
          stripeKey={process.env.REACT_APP_STRIPE_API_KEY}
        >
          <button style={buttonStyles}>Check Out</button>
        </StripeCheckout>
      </div>
    );
  }
}

const mapStateToProps = (globalState) => {
  return {
    products: globalState.customerInfo.currentCart,
    cartId: globalState.customerInfo.currentCartId,
  };
};


const mapDispatchToProps = { updateStateWithNewCart, deleteProductFromCart, increaseQuantity, decreaseQuantity };

export default connect(mapStateToProps, mapDispatchToProps)(CartContainer);
