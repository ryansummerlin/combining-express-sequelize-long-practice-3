
const paginate = function(req, errorResult) {

    let page = req.query.page;
    let size = req.query.size;
    let limit;
    let offset;

    if (isNaN(page)) {
        page = 1;
    }

    if (isNaN(size)) {
        size = 10;
    }

    if (size == 0 && page == 0) {
        limit = 10000000;
        offset = 0;
    } else if (size > 200 || page < 1) {
        errorResult.errors.push({ message: 'Requires valid page and size params'});
    } else {
        limit = size;
        offset = ((page - 1) * size);
    }

    return [limit, offset];

}

module.exports = paginate;
