#!/usr/bin/env python3
import tkinter as tk
from tkinter import messagebox, scrolledtext
import requests

# Change the following if your GoodData endpoint is different.
BASE_URL = "https://prod.mavenlinkreports.com"


class GoodDataApp:
    def __init__(self, master):
        self.master = master
        self.session = requests.Session()
        self.project_id = None
        self.build_login_window()

    def build_login_window(self):
        self.master.title("GoodData Login")
        # Username
        tk.Label(self.master, text="Username (email):").grid(row=0, column=0, padx=5, pady=5, sticky="w")
        self.username_entry = tk.Entry(self.master, width=40)
        self.username_entry.grid(row=0, column=1, padx=5, pady=5)
        # Password
        tk.Label(self.master, text="Password:").grid(row=1, column=0, padx=5, pady=5, sticky="w")
        self.password_entry = tk.Entry(self.master, width=40, show="*")
        self.password_entry.grid(row=1, column=1, padx=5, pady=5)
        # Project ID – you must supply the project where the metric will be created.
        tk.Label(self.master, text="Project ID:").grid(row=2, column=0, padx=5, pady=5, sticky="w")
        self.project_entry = tk.Entry(self.master, width=40)
        self.project_entry.grid(row=2, column=1, padx=5, pady=5)
        # Login button
        tk.Button(self.master, text="Login", command=self.login).grid(row=3, column=0, columnspan=2, pady=10)

    def login(self):
        username = self.username_entry.get().strip()
        password = self.password_entry.get().strip()
        project_id = self.project_entry.get().strip()
        if not username or not password or not project_id:
            messagebox.showerror("Error", "Please fill in all fields.")
            return

        login_url = BASE_URL + "/gdc/account/login"
        payload = {
            "postUserLogin": {
                "login": username,
                "password": password,
                "remember": "1",
                "verify_level": 0
            }
        }
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            # Customize your User-Agent as needed.
            "User-Agent": "GoodDataPythonClient/1.0 (your_email@example.com)"
        }

        try:
            response = self.session.post(login_url, json=payload, headers=headers)
            if response.status_code == 200:
                # A successful login returns 200 and sets cookies (GDCAuthTT etc.).
                self.project_id = project_id
                messagebox.showinfo("Login Successful", "You have logged in successfully!")
                self.open_metric_window()
            else:
                messagebox.showerror("Login Failed",
                                     f"Login failed with status code {response.status_code}:\n{response.text}")
        except Exception as e:
            messagebox.showerror("Error", f"Error during login:\n{str(e)}")

    def open_metric_window(self):
        # Remove login window widgets
        for widget in self.master.winfo_children():
            widget.destroy()

        self.master.title("Create New Metric")
        # Metric name field
        tk.Label(self.master, text="Metric Name:").grid(row=0, column=0, padx=5, pady=5, sticky="w")
        self.metric_name_entry = tk.Entry(self.master, width=60)
        self.metric_name_entry.grid(row=0, column=1, padx=5, pady=5)
        # MAQL code text area (using scrolledtext for convenience)
        tk.Label(self.master, text="MAQL Code:").grid(row=1, column=0, padx=5, pady=5, sticky="nw")
        self.maql_text = scrolledtext.ScrolledText(self.master, width=60, height=10)
        self.maql_text.grid(row=1, column=1, padx=5, pady=5)
        # Create metric button
        tk.Button(self.master, text="Create Metric", command=self.create_metric)\
            .grid(row=2, column=0, columnspan=2, pady=10)

    def create_metric(self):
        metric_name = self.metric_name_entry.get().strip()
        maql_code = self.maql_text.get("1.0", tk.END).strip()
        if not metric_name or not maql_code:
            messagebox.showerror("Error", "Please enter both a metric name and MAQL code.")
            return

        # Construct the JSON payload as required by GoodData's metadata objects creation.
        payload = {
            "metric": {
                "meta": {
                    "title": metric_name,
                    "category": "metric"
                },
                "content": {
                    "expression": maql_code
                }
            }
        }
        create_url = f"{BASE_URL}/gdc/md/{self.project_id}/obj"
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "GoodDataPythonClient/1.0 (your_email@example.com)"
        }

        try:
            response = self.session.post(create_url, json=payload, headers=headers)
            if response.status_code in (200, 201):
                # Successful creation: the response typically returns the new object URI.
                try:
                    result = response.json()
                    metric_uri = result.get("uri", "Not returned")
                except Exception:
                    metric_uri = "Not available (could not decode response)"
                messagebox.showinfo("Success", f"Metric created successfully!\nMetric URI: {metric_uri}")
            else:
                messagebox.showerror("Error", f"Failed to create metric.\nStatus code: {response.status_code}\n{response.text}")
        except Exception as e:
            messagebox.showerror("Error", f"Error during metric creation:\n{str(e)}")


if __name__ == "__main__":
    root = tk.Tk()
    app = GoodDataApp(root)
    root.mainloop()
