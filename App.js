/**StAuth10244: I Karanveer Singh, 000930881 certify that this material is my original work. No other person's work has been used without due acknowledgement. I have not made my work available to anyone else.**/

import React, { useState } from "react";
import {View,Text,TextInput,Button,FlatList,StyleSheet,Image,ActivityIndicator,ScrollView,} from "react-native";

export default function App() {
  const [driver, setDriver] = useState("");
  const [driverData, setDriverData] = useState(null);
  const [raceResults, setRaceResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]); // To store filtered podium races
  const [championships, setChampionships] = useState("N/A");
  const [careerDescription, setCareerDescription] = useState("Loading...");
  const [driverImage, setDriverImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPodiums, setShowPodiums] = useState(false);

  const fetchDriverStats = async () => {
    if (!driver.trim()) return;
    setLoading(true);
    setShowPodiums(false); // Reset podium view

    try {
      const formattedDriver = driver.toLowerCase().replace(" ", "_");

      const driverResponse = await fetch(
        `https://ergast.com/api/f1/drivers/${formattedDriver}.json`
      );
      const driverDataJson = await driverResponse.json();
      const driverInfo = driverDataJson.MRData.DriverTable.Drivers[0];

      if (!driverInfo) {
        alert("Driver not found. Please enter a valid F1 driver name.");
        setLoading(false);
        return;
      }

      const driverId = driverInfo.driverId;

      let races = [];
      const currentYear = new Date().getFullYear();
      let seasonFetches = [];

      for (let year = currentYear; year >= 1950; year--) {
        seasonFetches.push(
          fetch(
            `https://ergast.com/api/f1/${year}/drivers/${driverId}/results.json?limit=100`
          ).then((res) => res.json())
        );
      }

      const seasonResults = await Promise.all(seasonFetches);
      seasonResults.forEach((seasonData) => {
        if (seasonData.MRData.RaceTable.Races.length > 0) {
          races = [...races, ...seasonData.MRData.RaceTable.Races];
        }
      });

      // Sort races newest first
      races.sort((a, b) => new Date(b.date) - new Date(a.date));

      // Find podium finishes
      const podiumRaces = races.filter(
        (race) => ["1", "2", "3"].includes(race.Results[0].position)
      );

      let totalChampionships = 0;
      const championshipResponse = await fetch(
        `https://ergast.com/api/f1/drivers/${driverId}/driverStandings.json`
      );
      const championshipData = await championshipResponse.json();
      const standingsList = championshipData.MRData.StandingsTable.StandingsLists;

      standingsList.forEach((season) => {
        const driverStanding = season.DriverStandings.find(
          (d) => d.Driver.driverId === driverId
        );
        if (driverStanding && driverStanding.position === "1") {
          totalChampionships++;
        }
      });

      setDriverData(driverInfo);
      setRaceResults(races);
      setFilteredResults(podiumRaces);
      setChampionships(totalChampionships);

      fetchWikipediaData(driverInfo.givenName + " " + driverInfo.familyName);
    } catch (error) {
      console.error(error);
      alert("Error fetching data. Please try again.");
    }

    setLoading(false);
  };

  const fetchWikipediaData = async (driverFullName) => {
    const wikiName = driverFullName.replace(" ", "_");

    try {
      const wikiResponse = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${wikiName}`
      );
      const wikiData = await wikiResponse.json();

      if (wikiData.thumbnail && wikiData.thumbnail.source) {
        setDriverImage(wikiData.thumbnail.source);
      } else {
        setDriverImage(null);
      }

      setCareerDescription(wikiData.extract || "No description available.");
    } catch (error) {
      console.error("Wikipedia fetch error:", error);
      setCareerDescription("No description available.");
      setDriverImage(null);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🏎️ F1 Driver Stats</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter driver name (e.g., Max Verstappen)"
        value={driver}
        onChangeText={setDriver}
      />

      <Button title="Search Driver" color="#FF0000" onPress={fetchDriverStats} />

      {loading && (
        <ActivityIndicator size="large" color="#FF0000" style={{ marginTop: 10 }} />
      )}

      {driverData && !loading && (
        <View style={styles.card}>
          {driverImage ? (
            <Image source={{ uri: driverImage }} style={styles.driverImage} />
          ) : (
            <Text style={styles.noImage}>No Image Available</Text>
          )}
          <Text style={styles.driverName}>
            {driverData.givenName} {driverData.familyName}
          </Text>
          <Text style={styles.details}>Nationality: {driverData.nationality}</Text>
          <Text style={styles.details}>DOB: {driverData.dateOfBirth}</Text>
          <Text style={styles.details}>Code: {driverData.code || "N/A"}</Text>
          <Text style={styles.details}>🏆 Championships: {championships}</Text>
          <Text style={styles.description}>📖 {careerDescription}</Text>

          <Button
            title={showPodiums ? "Show All Races" : "View Podiums 🏆"}
            color="#FFD700"
            onPress={() => setShowPodiums(!showPodiums)}
          />
        </View>
      )}

      {raceResults.length > 0 && !loading && (
        <>
          <Text style={styles.subtitle}>🏁 {showPodiums ? "Podium Finishes" : "All Races (Newest First)"}:</Text>
          <FlatList
            data={showPodiums ? filteredResults : raceResults}
            keyExtractor={(item) => item.raceName + item.date}
            renderItem={({ item }) => (
              <View style={styles.listItem}>
                <Text style={styles.raceText}>
                  {item.raceName} ({item.season}) - {item.date}
                </Text>
                <Text style={styles.position}>
                  Position: {item.Results[0].position}
                </Text>
              </View>
            )}
            scrollEnabled={false} 
          />
        </>
      )}
    </ScrollView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#F2F2F2",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    color: "#FF0000",
    marginBottom: 15,
    marginTop: 60,
  },
  input: {
    borderWidth: 2,
    borderColor: "#FF0000",
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 10,
  },
  card: {
    padding: 15,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.2,
    elevation: 5,
    marginTop: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  driverImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 10,
  },
  noImage: {
    fontSize: 14,
    fontStyle: "italic",
    color: "#999",
  },
  driverName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 5,
  },
  details: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    marginBottom: 3,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 15,
    color: "#FF0000",
    textAlign: "center",
  },
  listItem: {
    backgroundColor: "#FFF",
    padding: 12,
    marginVertical: 5,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.2,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  raceText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  position: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF0000",
  },
  description: {
    marginTop: 10,
    fontStyle: "italic",
    color: "#555",
    textAlign: "left",
    paddingHorizontal: 10,
  },
});