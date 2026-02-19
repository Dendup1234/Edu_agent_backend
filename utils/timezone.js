import axios from "axios";

// fetching all the time zone
export const fetchTimezones = async () => {
  try {
    const response = await axios.get(
      "https://api.apyhub.com/data/dictionary/timezone",
      {
        headers: {
          "apy-token": process.env.APYHUB_API_KEY, // your API key
        },
      },
    );

    // Extract ONLY the timezone values
    const timeZones = response.data.data.map((item) => item.value);

    return timeZones;
  } catch (error) {
    console.error("Timezone fetch failed:", error.message);
    throw error;
  }
};
