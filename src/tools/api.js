import axios from 'axios';
let data;
export const customRouter = (hook) => {
  hook(data);
};

const api = 'http://26.140.209.161:8000/';
export function addRouteToDbFromFront(data) {
  axios
    .post(`${api}addRouteToDbFromFront`, data)
    .then((response) => {
      console.log(response);
    })
    .catch((error) => {
      console.error(error);
    });
}

export function editRoute(data) {
  axios
    .post(`${api}editRoute`, data)
    .then((response) => {
      console.log(response);
    })
    .catch((error) => {
      console.error(error);
    });
}

export function saveFrontObject(data) {
  axios
    .post(`${api}saveFrontObj`, data)
    .then((response) => {
      console.log(response);
    })
    .catch((error) => {
      console.error(error);
    });
}

export async function getRoute(user, build) {
  try {
    const response = await axios.get(`${api}getObj/${user}/${build}`);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export function getAllRoutes(user, build) {
  axios
    .get(`${api}allRoutes/${user}`)
    .then((response) => {
      return response.data;
    })
    .catch((error) => {
      console.error(error);
    });
}
