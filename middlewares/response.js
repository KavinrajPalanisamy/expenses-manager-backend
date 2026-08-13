module.exports.sendRsp = (res, statusCode = 200, isSuccess, message, data) => {
    res.status(statusCode || 200).json({
    success: isSuccess || true,
    message: message || 'Data fetched successfully',
    data: data || []
  });
}