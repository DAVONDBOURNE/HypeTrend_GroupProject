/* ============================================================
   HypeTrends - script.js
   CIT2011 Web Programming - UTech Jamaica
   ============================================================ */


/* ============================================================
   SECTION 1: REGISTRATION
   Kyle Ming - 2405545
   ============================================================ */

document.addEventListener("DOMContentLoaded", function () {

    /* --- REGISTRATION FORM HANDLER --- */
    let registerForm = document.getElementById("registerForm");

    if (registerForm) {

        registerForm.addEventListener("submit", function (e) {
            e.preventDefault(); /* stop page from refreshing */

            /* --- INPUT: Get values from form fields --- */
            let fullName    = document.getElementById("fullName").value.trim();
            let dob         = document.getElementById("dob").value;
            let email       = document.getElementById("email").value.trim();
            let trn         = document.getElementById("trn").value.trim();
            let password    = document.getElementById("password").value;
            let confirmPass = document.getElementById("confirmPassword").value;
            let message     = document.getElementById("registerMessage");

            /* --- PROCESS: Validate each field --- */

            /* Check all fields are filled */
            if (!fullName || !dob || !email || !trn || !password || !confirmPass) {
                showMessage(message, "All fields are required.", "red");
                return;
            }

            /* Validate email has @ symbol */
            if (!email.includes("@")) {
                showMessage(message, "Invalid email format.", "red");
                return;
            }

            /* Validate TRN: must be exactly 9 digits */
            let trnPattern = /^\d{9}$/; /* regex: 9 numbers only */
            if (!trnPattern.test(trn)) {
                showMessage(message, "TRN must be exactly 9 digits.", "red");
                return;
            }

            /* Check age: must be 18 or older */
            let birthDate = new Date(dob);
            let today     = new Date();
            let age       = today.getFullYear() - birthDate.getFullYear();
            /* Adjust if birthday hasn't happened yet this year */
            let monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            if (age < 18) {
                showMessage(message, "You must be at least 18 years old to register.", "red");
                return;
            }

            /* Password must be at least 8 characters */
            if (password.length < 8) {
                showMessage(message, "Password must be at least 8 characters.", "red");
                return;
            }

            /* Passwords must match */
            if (password !== confirmPass) {
                showMessage(message, "Passwords do not match.", "red");
                return;
            }

            /* --- Check TRN uniqueness in localStorage --- */
            let allUsers = JSON.parse(localStorage.getItem("RegistrationData")) || [];

            /* Loop through existing users to see if TRN is already taken */
            let trnExists = allUsers.find(function (user) {
                return user.trn === trn;
            });

            if (trnExists) {
                showMessage(message, "A user with this TRN already exists.", "red");
                return;
            }

            /* --- OUTPUT: Save new user to localStorage --- */
            let newUser = {
                fullName: fullName,
                dob:      dob,
                email:    email,
                trn:      trn,
                password: password
            };

            allUsers.push(newUser); /* add new user to the array */
            localStorage.setItem("RegistrationData", JSON.stringify(allUsers)); /* save array */

            showMessage(message, "Registration successful! Redirecting to login...", "green");

            /* Redirect to login page after 1.5 seconds */
            setTimeout(function () {
                window.location.href = "login.html";
            }, 1500);
        });
    }


    /* ============================================================
       SECTION 2: LOGIN (TRN-based, 3 attempts + lockout)
       ============================================================ */

    let loginForm = document.getElementById("loginForm");

    if (loginForm) {

        let errorMsg = document.getElementById("loginError");

        /* Get current attempt count from localStorage (persists between refreshes) */
        let attempts = parseInt(localStorage.getItem("loginAttempts")) || 0;
        let lockTime = parseInt(localStorage.getItem("lockTime")) || 0;

        /* Check if currently locked out */
        checkLock(errorMsg, lockTime);

        loginForm.addEventListener("submit", function (e) {
            e.preventDefault();

            /* Re-check lock every time they try */
            let now = Date.now();
            if (checkLock(errorMsg, lockTime)) return;

            /* --- INPUT: Get TRN and password --- */
            let trn      = document.getElementById("trn").value.trim();
            let password = document.getElementById("password").value;

            /* Basic empty check */
            if (!trn || !password) {
                showMessage(errorMsg, "Please enter your TRN and password.", "red");
                return;
            }

            /* --- PROCESS: Look up user in RegistrationData --- */
            let allUsers = JSON.parse(localStorage.getItem("RegistrationData")) || [];

            let matchedUser = allUsers.find(function (user) {
                return user.trn === trn && user.password === password;
            });

            /* --- OUTPUT: Handle result --- */
            if (matchedUser) {
                /* Correct login - reset attempts and save logged-in user */
                localStorage.removeItem("loginAttempts");
                localStorage.removeItem("lockTime");
                localStorage.setItem("loggedInUser", JSON.stringify(matchedUser));

                showMessage(errorMsg, "Login successful! Redirecting...", "green");

                setTimeout(function () {
                    window.location.href = "products.html";
                }, 1200);

            } else {
                /* Wrong credentials - increment attempt counter */
                attempts++;
                localStorage.setItem("loginAttempts", attempts);

                let remaining = 3 - attempts;

                if (attempts >= 3) {
                    /* Lock the user out for 30 seconds */
                    let lockUntil = Date.now() + 30000; /* 30 seconds in ms */
                    localStorage.setItem("lockTime", lockUntil);
                    showMessage(errorMsg, "Too many failed attempts! Locked for 30 seconds.", "red");
                } else {
                    showMessage(errorMsg, "Incorrect TRN or password. " + remaining + " attempt(s) left.", "red");
                }
            }
        });
    }


    /* ============================================================
       SECTION 3: CART
       Davon Bourne - 2406849
       ============================================================ */

    /* Display cart on cart.html page */
    if (document.getElementById("cartItems")) {
        displayCart();
    }

    /* Display summary on checkout page */
    if (document.getElementById("summary")) {
        loadCheckout();
    }

    /* Display invoice on invoice page */
    if (document.getElementById("invoiceContent")) {
        displayInvoice();
    }

    /* Display dashboard on dashboard page */
    if (document.getElementById("dashboardContent")) {
        showUserFrequency();
        showInvoices();
    }

});


/* ============================================================
   HELPER FUNCTION: Show a coloured message
   ============================================================ */
function showMessage(element, text, colour) {
    element.innerText = text;
    element.style.color = colour;
}


/* ============================================================
   HELPER FUNCTION: Check if user is locked out
   Returns true if locked, false if not
   ============================================================ */
function checkLock(errorElement, lockTime) {
    let now = Date.now();
    if (lockTime && now < lockTime) {
        let secondsLeft = Math.ceil((lockTime - now) / 1000);
        showMessage(errorElement, "Account locked. Try again in " + secondsLeft + " seconds.", "red");
        return true; /* still locked */
    }
    /* Lock expired - clean up */
    if (lockTime && now >= lockTime) {
        localStorage.removeItem("loginAttempts");
        localStorage.removeItem("lockTime");
    }
    return false; /* not locked */
}


/* ============================================================
   SECTION 3: CART FUNCTIONS
   Davon Bourne - 2406849
   ============================================================ */

/* Add item to cart */
function addToCart(name, price) {
    /* Load current cart from localStorage */
    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    /* Check if item already in cart */
    let existingItem = cart.find(function (i) {
        return i.name === name;
    });

    if (existingItem) {
        existingItem.qty += 1; /* increase quantity */
    } else {
        cart.push({ name: name, price: price, qty: 1 }); /* new item */
    }

    /* Save updated cart */
    localStorage.setItem("cart", JSON.stringify(cart));
    alert(name + " added to cart!");
}


/* Display cart items on cart.html */
function displayCart() {
    let cartItemsDiv = document.getElementById("cartItems");
    let totalDiv     = document.getElementById("total");

    if (!cartItemsDiv) return; /* safety check */

    /* Load cart from localStorage */
    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    /* If cart is empty */
    if (cart.length === 0) {
        cartItemsDiv.innerHTML = "<p style='color:#94a3b8;text-align:center;padding:20px;'>Your cart is empty.</p>";
        totalDiv.innerHTML = "";
        return;
    }

    cartItemsDiv.innerHTML = ""; /* clear old content */
    let subtotal = 0;

    /* Loop through each item and build HTML */
    cart.forEach(function (item) {
        let lineTotal = item.price * item.qty;
        subtotal += lineTotal;

        cartItemsDiv.innerHTML +=
            `<div class="cart-item">
                <span class="cart-item-name">${item.name}</span>
                <span>$${item.price.toLocaleString()} x ${item.qty} = <b>$${lineTotal.toLocaleString()}</b></span>
                <div>
                    <button class="qty-btn" onclick="changeQty('${item.name}', 1)">+</button>
                    <button class="qty-btn" onclick="changeQty('${item.name}', -1)">-</button>
                    <button class="qty-btn btn-danger" onclick="removeItem('${item.name}')">✕</button>
                </div>
            </div>`;
    });

    /* Calculate discount (10%) and tax (15%) */
    let discount   = subtotal * 0.10;
    let afterDisc  = subtotal - discount;
    let tax        = afterDisc * 0.15;
    let finalTotal = afterDisc + tax;

    /* Show totals */
    totalDiv.innerHTML =
        `<div class="cart-totals">
            <div>Subtotal: <b>$${subtotal.toLocaleString()}</b></div>
            <div>Discount (10%): <b style="color:#22c55e">- $${discount.toFixed(2)}</b></div>
            <div>Tax (15%): <b>$${tax.toFixed(2)}</b></div>
            <div style="font-size:1.1rem;color:var(--accent)">
                <b>Total: $${finalTotal.toFixed(2)}</b>
            </div>
        </div>`;
}


/* Change quantity of an item */
function changeQty(name, change) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    cart = cart.map(function (item) {
        if (item.name === name) {
            item.qty += change;
            if (item.qty < 1) item.qty = 1; /* minimum 1 */
        }
        return item;
    });

    localStorage.setItem("cart", JSON.stringify(cart));
    displayCart(); /* refresh the display */
}


/* Remove item completely from cart */
function removeItem(name) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    cart = cart.filter(function (item) {
        return item.name !== name; /* keep everything EXCEPT this item */
    });
    localStorage.setItem("cart", JSON.stringify(cart));
    displayCart();
}


/* Clear the entire cart */
function clearCart() {
    localStorage.removeItem("cart");
    displayCart();
}


/* ============================================================
   SECTION 4: CHECKOUT
   Davon Bourne - 2406849
   ============================================================ */

/* Load cart summary on checkout.html */
function loadCheckout() {
    let summaryDiv = document.getElementById("summary");
    if (!summaryDiv) return;

    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    if (cart.length === 0) {
        summaryDiv.innerHTML = "<p style='color:#94a3b8;'>No items in cart.</p>";
        return;
    }

    let html     = "";
    let subtotal = 0;

    /* List each item */
    cart.forEach(function (item) {
        let lineTotal = item.price * item.qty;
        subtotal += lineTotal;
        html += `<div class="invoice-row">
                    <span>${item.name} x${item.qty}</span>
                    <span>$${lineTotal.toLocaleString()}</span>
                 </div>`;
    });

    let discount   = subtotal * 0.10;
    let afterDisc  = subtotal - discount;
    let tax        = afterDisc * 0.15;
    let finalTotal = afterDisc + tax;

    html += `<div class="invoice-totals">
                <div>Subtotal: $${subtotal.toLocaleString()}</div>
                <div style="color:#22c55e">Discount (10%): -$${discount.toFixed(2)}</div>
                <div>Tax (15%): $${tax.toFixed(2)}</div>
                <div style="color:var(--accent);font-weight:bold;font-size:1.1rem">
                    Total: $${finalTotal.toFixed(2)}
                </div>
             </div>`;

    summaryDiv.innerHTML = html;
}


/* Confirm the order and generate invoice */
function confirmOrder() {
    /* --- INPUT: Shipping form fields --- */
    let name    = document.getElementById("shipName").value.trim();
    let address = document.getElementById("shipAddress").value.trim();
    let amount  = parseFloat(document.getElementById("amountPaid").value);
    let errorEl = document.getElementById("checkoutError");

    /* --- PROCESS: Validate fields --- */
    if (!name || !address || isNaN(amount)) {
        showMessage(errorEl, "Please fill in all shipping details.", "red");
        return false; /* stop form submission */
    }

    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    if (cart.length === 0) {
        showMessage(errorEl, "Your cart is empty!", "red");
        return false;
    }

    /* Calculate totals */
    let subtotal = 0;
    cart.forEach(function (item) {
        subtotal += item.price * item.qty;
    });

    let discount   = subtotal * 0.10;
    let afterDisc  = subtotal - discount;
    let tax        = afterDisc * 0.15;
    let finalTotal = afterDisc + tax;

    /* Check amount paid is enough */
    if (amount < finalTotal) {
        showMessage(errorEl, "Amount paid ($" + amount + ") is less than total ($" + finalTotal.toFixed(2) + ").", "red");
        return false;
    }

    /* --- Generate unique invoice number (INV + timestamp) --- */
    let invoiceNum = "INV" + Date.now();

    /* Get logged in user (if any) */
    let loggedUser = JSON.parse(localStorage.getItem("loggedInUser")) || { fullName: name, trn: "GUEST" };

    /* Build invoice object */
    let invoice = {
        invoiceNum:  invoiceNum,
        date:        new Date().toLocaleDateString(),
        customerName: name,
        customerTRN:  loggedUser.trn,
        address:      address,
        items:        cart,
        subtotal:     subtotal,
        discount:     discount,
        tax:          tax,
        total:        finalTotal,
        amountPaid:   amount,
        change:       amount - finalTotal
    };

    /* --- OUTPUT: Save invoice to AllInvoices array --- */
    let allInvoices = JSON.parse(localStorage.getItem("AllInvoices")) || [];
    allInvoices.push(invoice);
    localStorage.setItem("AllInvoices", JSON.stringify(allInvoices));

    /* Save current invoice separately for invoice.html to read */
    localStorage.setItem("currentInvoice", JSON.stringify(invoice));

    /* Clear the cart after successful order */
    localStorage.removeItem("cart");

    /* Go to invoice page */
    window.location.href = "invoice.html";
    return false; /* prevent default form submit */
}


/* ============================================================
   SECTION 5: INVOICE PAGE
   Davon Bourne - 2406849
   ============================================================ */

function displayInvoice() {
    let container = document.getElementById("invoiceContent");
    if (!container) return;

    /* Load the invoice that was just created */
    let inv = JSON.parse(localStorage.getItem("currentInvoice"));

    if (!inv) {
        container.innerHTML = "<p style='color:#94a3b8;text-align:center;'>No invoice found.</p>";
        return;
    }

    /* Build invoice rows for each item */
    let itemRows = "";
    inv.items.forEach(function (item) {
        itemRows += `<div class="invoice-row">
                        <span>${item.name} x${item.qty}</span>
                        <span>$${(item.price * item.qty).toLocaleString()}</span>
                     </div>`;
    });

    /* Build full invoice HTML */
    container.innerHTML =
        `<div class="invoice-header">
            <h2>🧾 HypeTrends</h2>
            <p>Invoice #: <b>${inv.invoiceNum}</b></p>
            <p>Date: ${inv.date}</p>
        </div>

        <div class="invoice-row">
            <span><b>Customer:</b></span>
            <span>${inv.customerName}</span>
        </div>
        <div class="invoice-row">
            <span><b>TRN:</b></span>
            <span>${inv.customerTRN}</span>
        </div>
        <div class="invoice-row">
            <span><b>Address:</b></span>
            <span>${inv.address}</span>
        </div>

        <br>
        <b style="color:var(--accent)">Items Purchased:</b><br><br>
        ${itemRows}

        <div class="invoice-totals">
            <div>Subtotal: $${inv.subtotal.toLocaleString()}</div>
            <div style="color:#22c55e">Discount (10%): -$${inv.discount.toFixed(2)}</div>
            <div>Tax (15%): $${inv.tax.toFixed(2)}</div>
            <div style="color:var(--accent);font-weight:bold;font-size:1.1rem">
                Total: $${inv.total.toFixed(2)}
            </div>
            <div>Amount Paid: $${inv.amountPaid.toFixed(2)}</div>
            <div style="color:#22c55e">Change: $${inv.change.toFixed(2)}</div>
        </div>

        <br>
        <p style="text-align:center;color:#94a3b8;font-size:0.85rem;">
            Thank you for shopping at HypeTrends! 🛍️
        </p>`;
}


/* ============================================================
   SECTION 6: DASHBOARD ANALYTICS
   Jameel Clarke - 2408769
   ============================================================ */

/* ShowUserFrequency - how many orders each user has made */
function showUserFrequency() {
    let container = document.getElementById("frequencyChart");
    if (!container) return;

    /* Load all invoices */
    let allInvoices = JSON.parse(localStorage.getItem("AllInvoices")) || [];

    if (allInvoices.length === 0) {
        container.innerHTML = "<p style='color:#94a3b8;'>No orders yet.</p>";
        return;
    }

    /* Count how many invoices each user (by TRN) has */
    let frequency = {}; /* object to store counts */

    allInvoices.forEach(function (inv) {
        let key = inv.customerName + " (" + inv.customerTRN + ")";
        if (frequency[key]) {
            frequency[key]++; /* increment if already exists */
        } else {
            frequency[key] = 1; /* first order */
        }
    });

    /* Find the max for scaling the bars */
    let maxCount = Math.max.apply(null, Object.values(frequency));

    /* Build bar chart HTML */
    let html = '<div class="bar-chart">';

    for (let user in frequency) {
        let count     = frequency[user];
        let barWidth  = Math.round((count / maxCount) * 100); /* percentage */

        html += `<div class="bar-row">
                    <span class="bar-label">${user}</span>
                    <div class="bar-fill" style="width:${barWidth}%">${count} order(s)</div>
                 </div>`;
    }

    html += "</div>";
    container.innerHTML = html;
}


/* ShowInvoices - display a table of all invoices */
function showInvoices() {
    let container = document.getElementById("invoiceTable");
    if (!container) return;

    let allInvoices = JSON.parse(localStorage.getItem("AllInvoices")) || [];

    if (allInvoices.length === 0) {
        container.innerHTML = "<p style='color:#94a3b8;'>No invoices found.</p>";
        return;
    }

    /* Build table */
    let html =
        `<table class="invoice-table">
            <thead>
                <tr>
                    <th>Invoice #</th>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>TRN</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>`;

    allInvoices.forEach(function (inv) {
        html += `<tr>
                    <td>${inv.invoiceNum}</td>
                    <td>${inv.date}</td>
                    <td>${inv.customerName}</td>
                    <td>${inv.customerTRN}</td>
                    <td>$${inv.total.toFixed(2)}</td>
                 </tr>`;
    });

    html += "</tbody></table>";
    container.innerHTML = html;
}


/* GetUserInvoices - filter invoices by the currently logged in user's TRN */
function getUserInvoices() {
    let container  = document.getElementById("myInvoicesTable");
    let loggedUser = JSON.parse(localStorage.getItem("loggedInUser"));

    if (!container) return;

    if (!loggedUser) {
        container.innerHTML = "<p style='color:#94a3b8;'>Please log in to view your invoices.</p>";
        return;
    }

    let allInvoices  = JSON.parse(localStorage.getItem("AllInvoices")) || [];

    /* Filter: only invoices where TRN matches logged in user */
    let myInvoices = allInvoices.filter(function (inv) {
        return inv.customerTRN === loggedUser.trn;
    });

    if (myInvoices.length === 0) {
        container.innerHTML = "<p style='color:#94a3b8;'>You have no orders yet.</p>";
        return;
    }

    let html =
        `<table class="invoice-table">
            <thead>
                <tr>
                    <th>Invoice #</th>
                    <th>Date</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>`;

    myInvoices.forEach(function (inv) {
        html += `<tr>
                    <td>${inv.invoiceNum}</td>
                    <td>${inv.date}</td>
                    <td>$${inv.total.toFixed(2)}</td>
                 </tr>`;
    });

    html += "</tbody></table>";
    container.innerHTML = html;
}
