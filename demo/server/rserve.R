source('init.R')

port <- Sys.getenv("PORT")
if (port == "") port <- "8081"

Rserve::run.Rserve(
    debug = FALSE,
    args = NULL,
    config.file = "rserve.conf"
)
