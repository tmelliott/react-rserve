# building widgets to connect R and rserve-ts
library(RserveTS)

histogramWidget <- createWidget(
    "HistogramWidget",
    properties = list(
        vars = ts_character(0L, default = names(iris)[names(iris) != "Species"]),
        var = ts_character(1L, default = ""),
        nBin = ts_integer(1L, default = 10L),
        counts = ts_numeric(0L, default = numeric(0)),
        selectedBar = ts_integer(1L, default = 0L),
        controller = "ANY" # Parent controller widget
    ),
    initialize = function(widget, parent = NULL) {
        # Assign parent to controller property
        if (!is.null(parent)) {
            widget$controller <- parent
        }

        widget$update()

        # selectedBar handler is conditional, stays in initialize
        if (!is.null(widget$controller)) {
            widget$addPropHandler("selectedBar", function() {
                x <- iris[[widget$var]]
                if (widget$selectedBar < 0) {
                    widget$controller$selectedRows <- seq_along(x)
                    return()
                }
                br <- hist(x,
                    seq(min(x), max(x), length.out = widget$nBin + 1L),
                    plot = FALSE
                )$breaks
                i <- widget$selectedBar + 1
                xx <- which(x >= br[i] & x < br[i + 1])

                widget$controller$selectedRows <- xx
            })
        }
    },
    methods = list(
        update = observer(c("var", "nBin"), function() {
            if (.self$var == "") {
                return()
            }
            x <- iris[[.self$var]]
            h <- hist(x,
                seq(min(x), max(x), length.out = .self$nBin + 1L),
                plot = FALSE
            )

            .self$counts <- as.numeric(h$counts)
        })
    ),
    export = TRUE
)

# desired usage, definition similar to R's Reference Class (RC) system
rngWidget <- createWidget(
    "RNGWidget",
    # define properties with their types (using RserveTS functions)
    properties = list(
        type = ts_character(1L, default = "normal"),
        value = ts_numeric(1L, default = 10)
    ),
    # define methods
    methods = list(
        generate = observer(c("value", "type"), ts_function(
            function() {
                switch(.self$type,
                    "normal" = rnorm,
                    "uniform" = runif
                )(.self$value)
            },
            result = ts_numeric()
        )),
        reset = ts_function(
            function() {
                cat("--reset")
            }
        )
    ),
    export = TRUE
)

barchartWidget <- createWidget(
    "BarchartWidget",
    properties = list(
        # controller = "ANY",
        data = ts_dataframe(label = ts_character(0L), count = ts_integer(0L)),
        subset = ts_integer(default = seq_len(nrow(iris)))
    ),
    initialize = function(widget) {
        widget$update()
    },
    methods = list(
        update = observer("subset", function() {
            tbl <- xtabs(~Species, data = iris[.self$subset, ]) |>
                as.data.frame() |>
                setNames(c("label", "count"))

            .self$data <- tbl
        })
    ),
    export = TRUE
)

ctrlWidget <- createWidget(
    "CtrlWidget",
    properties = list(
        selectedRows = ts_integer(0L),
        histogram = histogramWidget,
        barchart = barchartWidget
    ),
    methods = list(
        on_selectedRows = observer("selectedRows", function() {
            .self$barchart$subset <- .self$selectedRows
        }),
        # Reset the histogram without triggering observers for each property
        resetHistogram = ts_function(function() {
            .self$histogram$batch(c("var", "nBin"), {
                .self$histogram$var <- ""
                .self$histogram$nBin <- 10L
            })
        }),
        # Reset selection — restores barchart to full dataset
        reset = ts_function(function() {
            .self$selectedRows <- seq_len(nrow(iris))
        })
    ),
    export = TRUE
)
