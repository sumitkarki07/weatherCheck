from flask import Flask, render_template, request
import pandas as pd
import requests
from datetime import datetime

app = Flask(__name__)
API_KEY = "a8f5179c74ebb4d68af13c6b2ac4ae4f"

def is_rain_expected(lat, lon, target_date_str):
    target_date = datetime.strptime(target_date_str, "%Y-%m-%d").date()
    url = f"https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={API_KEY}"
    response = requests.get(url).json()

    for entry in response.get("list", []):
        forecast_date = datetime.strptime(entry["dt_txt"], "%Y-%m-%d %H:%M:%S").date()
        if forecast_date == target_date:
            if "rain" in entry["weather"][0]["main"].lower():
                return True
    return False

@app.route("/", methods=["GET", "POST"])
def index():
    message = ""
    if request.method == "POST":
        name = request.form["name"]
        address = request.form["address"]
        date = request.form["date"]
        lat = float(request.form["lat"])
        lon = float(request.form["lon"])

        if is_rain_expected(lat, lon, date):
            message = "🚫 Rain expected on this day. Please choose another date."
        else:
            df = pd.DataFrame([[name, address, date, lat, lon]], columns=["Name", "Address", "Date", "Latitude", "Longitude"])
            try:
                existing = pd.read_excel("bookings.xlsx")
                df = pd.concat([existing, df], ignore_index=True)
            except FileNotFoundError:
                pass
            df.to_excel("bookings.xlsx", index=False)
            message = "✅ Booking successful! See you on a clear day."

    return render_template("index.html", message=message)

if __name__ == "__main__":
    app.run(debug=True)
