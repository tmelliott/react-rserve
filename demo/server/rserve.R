source('init.R')

port <- as.integer(Sys.getenv("PORT"))
if (is.na(port)) port <- 8081

message("Connected to PORT:", port)

Rserve::run.Rserve(
    debug = TRUE,
    port = port,
    websockets.port = port,
    args = NULL,
    config.file = "rserve.conf"
)
