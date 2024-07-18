$(document).ready(function () {
    let customers = [];
    let transactions = [];
    let currentChart = null;
    let filteredTransactions = [];

    // Fetch data from JSON server
    async function fetchData() {
        try {
            const responseCustomers = await fetch(
                "https://my-json-server.typicode.com/minalotfysaad/Customer-Transactions/customers"
            );
            const dataCustomers = await responseCustomers.json();
            customers = dataCustomers;

            const responseTransactions = await fetch(
                "https://my-json-server.typicode.com/minalotfysaad/Customer-Transactions/transactions"
            );
            const dataTransactions = await responseTransactions.json();
            transactions = dataTransactions;
            displayTable(); // Initial display
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    }

    // Display table function
    function displayTable() {
        if (customers.length > 0 && transactions.length > 0) {
            const tableBody = $("#customerTable tbody");
            tableBody.empty();

            // Display filteredTransactions if available, otherwise display all transactions
            const transactionsToDisplay =
                filteredTransactions.length > 0
                    ? filteredTransactions
                    : transactions;

            transactionsToDisplay.forEach((transaction) => {
                const customer = customers.find(
                    (cust) => cust.id == transaction.customer_id
                );

                if (customer) {
                    tableBody.append(`
                        <tr data-bs-toggle="modal" data-bs-target="#customerModal" data-customer-id="${customer.id}">
                            <td>${customer.name}</td>
                            <td>${transaction.date}</td>
                            <td>${transaction.amount}</td>
                        </tr>
                    `);
                } else {
                    console.warn(
                        `No customer found for transaction ID ${transaction.id}`
                    );
                }
            });
        } else {
            console.warn(
                "Customers or transactions array is empty or not initialized properly."
            );
        }
    }

    // Sort table by column and order
    function sortTable(column, order) {
        const sortedTransactions = (
            filteredTransactions.length > 0
                ? filteredTransactions
                : transactions
        ).sort((a, b) => {
            if (column === "name") {
                const nameA =
                    customers.find((cust) => cust.id === a.customer_id)?.name ||
                    "";
                const nameB =
                    customers.find((cust) => cust.id === b.customer_id)?.name ||
                    "";
                return order === "asc"
                    ? nameA.localeCompare(nameB)
                    : nameB.localeCompare(nameA);
            } else if (column === "date") {
                return order === "asc"
                    ? new Date(a.date) - new Date(b.date)
                    : new Date(b.date) - new Date(a.date);
            } else if (column === "amount") {
                return order === "asc"
                    ? a.amount - b.amount
                    : b.amount - a.amount;
            }
        });

        displaySortedTable(sortedTransactions);
    }

    // Display sorted table
    function displaySortedTable(sortedTransactions) {
        const tableBody = $("#customerTable tbody");
        tableBody.empty();

        sortedTransactions.forEach((transaction) => {
            const customer = customers.find(
                (cust) => cust.id == transaction.customer_id
            );

            if (customer) {
                tableBody.append(`
                    <tr data-bs-toggle="modal" data-bs-target="#customerModal" data-customer-id="${customer.id}">
                        <td>${customer.name}</td>
                        <td>${transaction.date}</td>
                        <td>${transaction.amount}</td>
                    </tr>
                `);
            } else {
                console.warn(
                    `No customer found for transaction ID ${transaction.id}`
                );
            }
        });
    }

    // Handle click on sort buttons
    $("#customerTable thead th button.btn-sort").on("click", function () {
        const sortBy = $(this).data("sort");
        const currentOrder = $(this).data("order");
        const newOrder = currentOrder == "asc" ? "desc" : "asc";
        $(this).data("order", newOrder);

        // Reset sorting icons
        $(this)
            .closest("tr")
            .find("button.btn-sort i")
            .removeClass("fa-sort-up fa-sort-down active")
            .addClass("fa-sort");
        // Update sorting icon
        $(this)
            .find("i")
            .removeClass("fa-sort")
            .addClass(newOrder == "asc" ? "fa-sort-down" : "fa-sort-up")
            .addClass("active");

        // Sort table and display
        sortTable(sortBy, newOrder);
    });

    // Filter table
    $("#searchName").on("input", function () {
        const searchName = $(this).val().toLowerCase();
        filterTable(searchName, null);
    });

    $("#searchAmount").on("input", function () {
        const searchAmount = $(this).val().trim();
        filterTable(null, searchAmount);
    });

    function filterTable(name, amount) {
        filteredTransactions = transactions.filter((transaction) => {
            const customer = customers.find(
                (cust) => cust.id == transaction.customer_id
            );
            if (customer) {
                const nameMatch =
                    !name || customer.name.toLowerCase().includes(name);
                const amountMatch =
                    !amount || transaction.amount.toString().includes(amount); // Check if transaction amount includes the input amount
                return nameMatch && amountMatch;
            }
            return false;
        });

        displayTable();
    }

    // Display modal when row is clicked
    $(document).on("click", "#customerTable tbody tr", function () {
        const customerId = $(this).data("customer-id");
        const customer = customers.find((cust) => cust.id == customerId);
        if (customer) {
            displayModalContent(customer);
        }
    });

    function displayModalContent(customer) {
        // Update modal title
        $("#customerModalLabel").text(`Transactions for ${customer.name}`);

        // Update modal body with chart canvas
        const modalBody = $(".modal-body");
        modalBody.html(`
            <div class="chart-container">
                <canvas id="transactionChart"></canvas>
            </div>
        `);

        displayChart(customer.id);
    }

    // Display chart function
    function displayChart(customerId) {
        const customerTransactions = transactions
            .filter((transaction) => transaction.customer_id == customerId)
            .sort((a, b) => new Date(a.date) - new Date(b.date)); // Sort transactions by date

        const transactionData = customerTransactions.reduce(
            (acc, transaction) => {
                if (!acc[transaction.date]) {
                    acc[transaction.date] = 0;
                }
                acc[transaction.date] += transaction.amount;
                return acc;
            },
            {}
        );

        const labels = Object.keys(transactionData);
        const data = Object.values(transactionData);

        const ctx = $("#transactionChart");
        currentChart = new Chart(ctx, {
            type: "line",
            data: {
                labels: labels,
                datasets: [
                    {
                        label: "Total Transaction Amount",
                        data: data,
                        borderColor: "rgba(75, 192, 192, 1)",
                        borderWidth: 3,
                    },
                ],
                options: {
                    scales: {
                        x: {
                            beginAtZero: true,
                        },
                        y: {
                            beginAtZero: true,
                        },
                    },
                },
            },
        });
    }

    // Initialize data fetch
    fetchData();
});
