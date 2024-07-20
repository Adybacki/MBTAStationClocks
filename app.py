from flask import Flask, jsonify, request, render_template
import requests
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv
import os

load_dotenv()
app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///stations.db'
db = SQLAlchemy(app)

MBTA_API_URL = 'https://api-v3.mbta.com'
MBTA_API_KEY = os.getenv('API_KEY')

class Station(db.Model):
    id = db.Column(db.String, primary_key=True)
    name = db.Column(db.String, nullable=False)
    line = db.Column(db.String, nullable=True)
    platform = db.Column(db.String, nullable=True)

@app.before_first_request
def create_tables():
    db.create_all()
    headers = {'x-api-key': MBTA_API_KEY}
    response = requests.get(f'{MBTA_API_URL}/stops?filter[route_type]=0,1', headers=headers)
    data = response.json()
    existing_station_ids = {station.id for station in Station.query.all()}
    for station in data['data']:
        if station['id'] not in existing_station_ids:
            new_station = Station(
                id=station['id'],
                name=station['attributes']['name'],
                line=station['attributes']["description"].split(" - ")[1],
                platform=station['attributes']['platform_name']
            )
            db.session.add(new_station)
    db.session.commit()

@app.route('/search', methods=['GET'])
def search():
    query = request.args.get('query', '')
    if query:
        stations = Station.query.filter(Station.name.ilike(f'%{query}%')).all()
        unique_names = set()
        results = []
        for station in stations:
            normalized_name = ' '.join(station.name.lower().split())
            if normalized_name not in unique_names:
                unique_names.add(normalized_name)
                results.append(station.name)
        return jsonify(results[:3])
    return jsonify([])

@app.route('/station', methods=['GET'])
def station():
    station_name = request.args.get('name', '')
    station_group = Station.query.filter(Station.name == station_name).all()
    return render_template('station.html', station_name=station_name, station_group=station_group)

@app.route('/get_lines', methods=['GET'])
def get_lines():
    station_name = request.args.get('station_name', '')
    query = Station.query.filter()

@app.route('/get_platforms', methods=['GET'])
def get_platforms():
    line = request.args.get('line', '')
    station_name = request.args.get('station_name', '')
    query = Station.query.filter(Station.line == line)
    if station_name:
        query = query.filter(Station.name == station_name)
    stations = query.all()
    platforms_with_stop_id = [{'stop_id': station.id, 'platform': station.platform} for station in stations]
    return jsonify(platforms_with_stop_id)

@app.route('/prediction', methods=['GET'])
def prediction():
    station_name = request.args.get('station_name', '')
    line = request.args.get('line', '')
    platform = request.args.get('platform', '')
    station_id = request.args.get('station_id', '')
    return render_template('prediction.html', station_name=station_name, line=line, platform=platform, station_id=station_id)

@app.route('/api/train-arrivals', methods=['GET'])
def train_arrivals():
    station_id = request.args.get('station_id', '')
    headers = {'x-api-key': MBTA_API_KEY}
    response = requests.get(f'{MBTA_API_URL}/predictions?filter[stop]={station_id}&sort=time', headers=headers)
    return jsonify(response.json()['data'])

@app.route('/api/get-headsign', methods=['GET'])
def get_headsign():
    trip_id = request.args.get('trip_id', '')
    headers = {'x-api-key': MBTA_API_KEY}
    response = requests.get(f'{MBTA_API_URL}/trips?filter[id]={trip_id}', headers=headers)
    return jsonify(response.json()['data'][0]['attributes']['headsign'])

@app.route('/api/get-vehicle', methods=['GET'])
def get_vehicle():
    trip_id = request.args.get('trip_id', '')
    headers = {'x-api-key': MBTA_API_KEY}
    response = requests.get(f'{MBTA_API_URL}/vehicles?filter[trip]={trip_id}', headers=headers)
    return jsonify(response.json()['data'])

@app.route('/', methods=['GET', 'POST'])
def index():
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True)
