library(RserveTS)

fn_mean <- ts_function(mean, x = ts_numeric(), result = ts_numeric(1), export = TRUE)
fn_first <- ts_function(function(x = ts_character()) x[1],
    result = ts_character(1),
    export = TRUE
)

sample_num <- ts_function(
    sample,
    x = ts_numeric(0),
    size = ts_integer(1),
    result = ts_numeric(),
    export = TRUE
)


iterate <- ts_function(
    function(update = js_function(ts_numeric(1), result = ts_numeric(1))) {
        cat("Starting iteration ...\n")

        # oobMessage expects a response!
        # TODO: automate this bit??
        if (class(update) != "javascript_function") stop("Not a function")
        update_fn <- function(...) {
            Rserve::self.oobMessage(list(update, ...))
        }

        # note: this is *locking* the R session
        for (i in 1:10) {
            Sys.sleep(1)
            cat("\n-", i)
            update_fn(i)
        }

        cat("\n done.\n")

        invisible(NULL)
    },
    result = ts_null(),
    export = TRUE
)

bad_fn <- ts_function(
    function() {
        Sys.sleep(0.5)
        stop("There was an error in R")
    },
    result = ts_union(ts_numeric(1), ts_undefined()),
    export = TRUE
)
