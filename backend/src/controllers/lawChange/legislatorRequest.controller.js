import * as legislatorRequestService from '../../services/lawChange/legislatorRequest.service.js';

export const submitRequest = async (req, res, next) => {
  try {
    const request = await legislatorRequestService.submitRequest(req.user._id, req.body);
    res.status(201).json(request);
  } catch (err) { next(err); }
};

export const getMyRequest = async (req, res, next) => {
  try {
    const request = await legislatorRequestService.getMyRequest(req.user._id);
    res.json(request || null);
  } catch (err) { next(err); }
};

export const getAllRequests = async (req, res, next) => {
  try {
    const { status } = req.query;
    const requests = await legislatorRequestService.getAllRequests({ status });
    res.json(requests);
  } catch (err) { next(err); }
};

export const approveRequest = async (req, res, next) => {
  try {
    const request = await legislatorRequestService.approveRequest(req.params.id, req.user._id);
    res.json(request);
  } catch (err) { next(err); }
};

export const rejectRequest = async (req, res, next) => {
  try {
    const { review_note } = req.body;
    const request = await legislatorRequestService.rejectRequest(req.params.id, req.user._id, review_note);
    res.json(request);
  } catch (err) { next(err); }
};

export const setUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const user = await legislatorRequestService.setUserRole(req.params.id, role);
    res.json(user);
  } catch (err) { next(err); }
};
