import { useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { config } from "../utils/ConfigUtils";

const GoogleLoad = () => {
  const { handleSaveToken } = useContext(AuthContext);
  const navigate = useNavigate();

  const checkAuthAndFetchPermissions = async () => {
    try {
      const tokenValidationResponse = await fetch(
        `${config.backUrl}/api/users/validate-token`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (tokenValidationResponse.ok) {
        const result = await tokenValidationResponse.json();
        handleSaveToken(result.token);
        navigate("/home");
      } else {
        navigate("/");
      }
    } catch (error) {
      console.error("Error during token validation:", error);
      navigate("/");
    }
  };

  useEffect(() => {
    checkAuthAndFetchPermissions();
  }, []);

  return null;
};

export default GoogleLoad;
