const connectSocket = async () => {
    try {
        // Create socket connection with proper namespace handling
        // Extract the base URL and namespace from the provided URL
        const urlParts = url.split("/socket/");
        const baseUrl = urlParts[0]; 
        const namespace = 
            urlParts.length > 1 ? `/socket/${urlParts[1]}` : SOCKET_NAMESPACE;

        // Properly connect to a Socket.io namespace
        // The path should be "/socket.io" (default Socket.io path)
        // The namespace is specified in the URL itself
        socketRef.current = io(`${baseUrl}${namespace}`, {
            reconnectionAttempts: SOCKET_CONFIG.maxReconnectAttempts,
            reconnectionDelay: SOCKET_CONFIG.reconnectionDelay,
            timeout: 30000,
            withCredentials: true,
            // transports: ["websocket", "polling"],
        });

        socketRef.current.on("connect", () => {
            console.log("Socket connected successfully");
            setSocketInstance(socketRef.current);
            setIsConnected(true);
            setError(null);
            reconnectAttempts.current = 0;
            lastHeartbeat.current = Date.now();