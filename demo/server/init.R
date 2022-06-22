wrap.js.fun <- function(s)
{
  if (class(s) != "javascript_function")
    stop("Can only wrap javascript_function s");
  function(...) {
    Rserve::self.oobMessage(list(s, ...))
  }
}

wrap.r.fun <- Rserve:::ocap

give.first.functions <- function()
{
    list(
        rversion = wrap.r.fun(function() as.character(getRversion()))
    )
}

####################################################################################################
# make.oc turns a function into an object capability accessible from the remote side

# oc.init must return the first capability accessible to the remote side
oc.init <- function()
{
  wrap.r.fun(give.first.functions)
}
